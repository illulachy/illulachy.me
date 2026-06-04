---
type: blog
title: "Sync that doesn't trust the server"
date: May 04, 2026
url: "/blog/lv-ch4-sync-that-doesnt-trust-server"
description: X25519 ECDH, HKDF key derivation, XChaCha20-Poly1305 authenticated encryption — all in ~370 lines of Rust. The sync server stores encrypted blobs it can never read.
tags: ["the-local-first-accountant", "liquidview", "e2ee", "device-sync", "cryptography", "rust", "build-in-public"]
category: Engineering
---

I wanted to use LiquidView on my laptop and my desktop. I wanted the data on both machines to stay in sync. I did not want a server somewhere holding a copy of my financial data.

That's a contradictory set of requirements unless the server never sees plaintext data. Which means encryption. But not transport encryption — TLS protects data in transit, but the server still sees the decrypted payload. I needed end-to-end encryption where the sync server is a dumb relay that stores ciphertext it can never read.

So I implemented X25519 ECDH key exchange, HKDF key derivation, XChaCha20-Poly1305 authenticated encryption, and Short Authentication Strings for device pairing — all in Rust, all in ~370 lines of code, all around a sync engine that pushes and pulls encrypted blobs.

This was the most fun I've had writing Rust.

---

## The Pairing Dance

Two devices need to share data. They've never met. There's no central server to broker trust. How do they establish a shared secret?

The answer is a pairing dance with three roles:

| Role | What it means |
|---|---|
| **Bootstrap** | The first device. Creates the root encryption key. |
| **Pair** | A new device that wants in. Someone else approves it. |
| **Ready** | A trusted device that can sync. |

The bootstrap device generates a root key using `OsRng`:

```rust
fn generate_root_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}
```

When a new device wants to pair, it generates an ephemeral X25519 keypair and sends the public key to the bootstrap device. The bootstrap device computes a shared secret using ECDH:

```rust
fn compute_shared_secret(
    their_public: &x25519_dalek::PublicKey,
    our_secret: &x25519_dalek::StaticSecret,
) -> [u8; 32] {
    let shared_point = our_secret.diffie_hellman(their_public);
    shared_point.to_bytes()
}
```

But before trusting the shared secret, both devices verify each other using a Short Authentication String (SAS) — a human-readable code displayed on both screens:

```rust
fn compute_sas(shared_secret: &[u8]) -> String {
    let hash = Sha256::digest(shared_secret);
    let code = u32::from_le_bytes(hash[..4].try_into().unwrap()) % 100000;
    format!("{:05}", code)
}
```

The user sees the same 5-digit code on both devices. If they match, the pairing is confirmed. This prevents man-in-the-middle attacks without needing a certificate authority.

---

## The Data Encryption Key

Once paired, the root key is never used directly. Instead, it derives Data Encryption Keys (DEKs) using HKDF:

```rust
fn derive_dek(root_key: &[u8; 32], key_version: u32) -> [u8; 32] {
    let hk = Hkdf::<Sha256>::from_prk(root_key).unwrap();
    let mut dek = [0u8; 32];
    hk.expand(&key_version.to_le_bytes(), &mut dek).unwrap();
    dek
}
```

Key versioning means I can rotate keys without re-pairing devices. Each encrypted blob carries a key version number. When the key is rotated, devices derive the new key from the same root.

---

## Encryption

Every sync payload is encrypted with XChaCha20-Poly1305 — an authenticated encryption scheme that provides confidentiality, integrity, and authenticity:

```rust
fn encrypt(plaintext: &[u8], key: &[u8; 32]) -> Vec<u8> {
    let nonce = XNonce::from_slice(&generate_nonce());
    let cipher = XChaCha20Poly1305::new(key.into());
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .expect("encryption failed");

    // Return: nonce (24 bytes) + ciphertext
    [nonce.as_slice(), &ciphertext].concat()
}
```

The nonce is randomly generated for every encryption operation. Even if you encrypt the same data twice, the ciphertext is different. The `Poly1305` tag (embedded in the ciphertext) ensures that any tampering is detected before decryption.

---

## The Sync Engine

The sync engine itself is a background loop that runs on every device:

```rust
async fn run_sync_cycle(device: &DeviceState) -> Result<()> {
    // 1. Push local changes
    let outbox = device.outbox_store.pending_entries().await?;
    for entry in outbox {
        let encrypted = encrypt(&entry.data, &device.current_dek());
        device.transport.push(encrypted).await?;
        device.outbox_store.mark_sent(entry.id).await?;
    }

    // 2. Pull remote changes
    let cursor = device.cursor_store.current().await?;
    let remote = device.transport.pull_since(cursor).await?;
    for entry in remote {
        let decrypted = decrypt(&entry.encrypted_data, &device.current_dek())?;
        device.replay_store.apply(decrypted).await?;
    }

    // 3. Reconcile
    device.outbox_store.prune().await?;
    device.cursor_store.advance().await?;
}
```

Conflict resolution is last-writer-wins (LWW) with entity-level granularity. If I update "Account A" on my laptop and update "Account B" on my desktop, both changes survive. If I update the same field on both devices, the later timestamp wins. This is a pragmatic choice — LWW doesn't handle all merge scenarios, but it handles the common ones without user intervention.

---

## The Outbox Pattern

Changes aren't sent immediately. They're written to an outbox table in the local SQLite database:

```sql
CREATE TABLE sync_outbox (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,    -- "create", "update", "delete"
    data BLOB NOT NULL,
    created_at TEXT NOT NULL,
    synced_at TEXT
);
```

The background engine polls the outbox periodically with exponential backoff and jitter to avoid thundering herd problems. If the server is down, changes queue up locally and sync when connectivity returns.

---

## What the Server Sees

The sync server — which is an optional cloud service — stores only encrypted blobs:

```json
{
  "device_id": "abc123",
  "blob": "xchacha20poly1305:c29ubmU...NvbWU=",
  "key_version": 1,
  "created_at": "2025-03-15T10:30:00Z"
}
```

No account names. No portfolio values. No transaction descriptions. The server doesn't even know which entity type is being synced — it just stores and relays opaque encrypted blobs.

---

## The Cost

E2EE device sync was the most rewarding technical challenge in the project. It also cost the most:

- **The fallback is manual export/import.** For users who can't or won't use the sync server, I built an export/import feature that produces an encrypted file they can transfer manually.
- **LWW doesn't solve everything.** If you update the same account name on two devices simultaneously, one overwrites the other. The alternative — CRDTs or operational transforms — would have multiplied the complexity.
- **The pairing UX is inherently awkward.** Displaying a 5-digit code and asking the user to verify it on another device is secure but not smooth.

---

The crypto in this chapter — X25519, HKDF, XChaCha20-Poly1305 — is the kind of implementation detail that most users will never see. But it's the foundation that makes the entire sync model possible. Without it, the server would be a honeypot. With it, the server is just a dumb relay.

→ Next: Chapter 5 — The FIRE calculator that would've been a whole SaaS
