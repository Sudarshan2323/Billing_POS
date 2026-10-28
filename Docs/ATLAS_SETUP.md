# MongoDB Atlas Setup Guide for BillBook

BillBook relies on MongoDB replica set transactions for atomic multi-document writes (invoice issue, ledger balance, stock movements). **MongoDB Atlas is the primary database target** for all environments. Every MongoDB Atlas cluster (including the free M0 tier) is configured as a replica set and natively supports multi-document ACID transactions.

---

## 1. Create MongoDB Atlas Project & Cluster

1. Sign in or register at [MongoDB Cloud](https://cloud.mongodb.com/).
2. Create a new Project named `BillBook`.
3. Click **Create Cluster**:
   - For **Development**: Choose **M0 Free Tier** (shared cluster in your nearest AWS/GCP region, e.g. `ap-south-1` Mumbai).
   - Set cluster name: `billbook-dev`.

---

## 2. Configure Database User (Least Privilege)

1. Navigate to **Security** -> **Database Access**.
2. Click **Add New Database User**:
   - Authentication Method: **Password**
   - Username: `billbook_app_dev`
   - Password: generate a secure password (store securely)
   - Database User Privileges: Select **Built-in Role** -> **Read and write to any database** (or restrict specifically to `billbook_dev`).
3. Click **Add User**.

---

## 3. Network Access & IP Allowlist

1. Navigate to **Security** -> **Network Access**.
2. Click **Add IP Address**:
   - For Local Dev: Click **Add Current IP Address** or add your development machine's public IP.
   - (For production hosting e.g. Render/Railway, specify the static outbound egress IP or VPC peering).
3. Click **Confirm**.

---

## 4. Get Connection String

1. Navigate to **Database** -> Click **Connect** next to your cluster.
2. Select **Drivers** (Node.js).
3. Copy the `mongodb+srv` connection string:
   ```env
   MONGODB_URI="mongodb+srv://billbook_app_dev:<password>@cluster0.mongodb.net/billbook_dev?retryWrites=true&w=majority"
   ```
4. Place this in `server/.env`:
   ```env
   MONGODB_URI="mongodb+srv://billbook_app_dev:<password>@cluster0.mongodb.net/billbook_dev?retryWrites=true&w=majority"
   ```

---

## 5. Offline Fallback (Optional)

If running without internet access, you can run a local replica set using Docker:
```bash
docker compose up -d mongo
```
And set:
```env
MONGODB_URI="mongodb://127.0.0.1:27017/billbook_dev?replicaSet=rs0&retryWrites=true&w=majority"
```
