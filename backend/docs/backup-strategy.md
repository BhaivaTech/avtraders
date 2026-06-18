# Backup Strategy

## Overview

The backup system provides automated database backups using `mysqldump` with configurable retention, compression, verification, and restore capabilities.

## Features

- ✅ **Full database backup** using `mysqldump`
- ✅ **Gzip compression** (configurable)
- ✅ **Retention policy** — auto-delete old backups
- ✅ **Backup verification** — integrity checks
- ✅ **Restore support** — restore from any backup
- ✅ **Metadata tracking** — JSON metadata for each backup
- ✅ **CLI interface** — easy to use and script

## Files

| File | Purpose |
|------|---------|
| `scripts/backup.js` | Backup script |
| `backups/` | Backup storage directory |

## Quick Start

### Create a Backup

```bash
npm run backup
```

Output:
```
[backup 2024-06-12T14:30:00.000Z] Starting backup of database "avtraders"...
[backup 2024-06-12T14:30:00.000Z] Host: 46.28.44.56:3306, User: appuser
[backup 2024-06-12T14:30:02.000Z] ✅ Backup created: ./backups/avtraders_2024-06-12T14-30-00.sql.gz (2.45 MB)
```

### List Backups

```bash
npm run backup:list
```

Output:
```
Available backups:
────────────────────────────────────────────────────────────────────────────────
File                                        Size        Created
────────────────────────────────────────────────────────────────────────────────
avtraders_2024-06-12T14-30-00.sql.gz        2.45 MB     2024-06-12T14:30:02.000Z
avtraders_2024-06-11T14-30-00.sql.gz        2.43 MB     2024-06-11T14:30:01.000Z
avtraders_2024-06-10T14-30-00.sql.gz        2.41 MB     2024-06-10T14:30:02.000Z
────────────────────────────────────────────────────────────────────────────────
Total: 3 backup(s)
```

### Verify Backup

```bash
npm run backup:verify
```

Output:
```
[backup 2024-06-12T14:30:05.000Z] Verifying backup: ./backups/avtraders_2024-06-12T14-30-00.sql.gz
  ✅ Has CREATE TABLE
  ✅ Has INSERT statements
  ✅ Has mysqldump header
  ✅ Not empty
[backup 2024-06-12T14:30:06.000Z] ✅ Backup verification passed.
```

### Restore from Backup

```bash
node scripts/backup.js --restore ./backups/avtraders_2024-06-12T14-30-00.sql.gz
```

Output:
```
[backup 2024-06-12T14:30:10.000Z] ⚠️  WARNING: This will overwrite the "avtraders" database!
[backup 2024-06-12T14:30:10.000Z] Restoring from: ./backups/avtraders_2024-06-12T14-30-00.sql.gz
[backup 2024-06-12T14:30:15.000Z] ✅ Restore completed successfully.
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `./backups` | Directory to store backups |
| `BACKUP_RETAIN` | `7` | Number of backups to keep |
| `BACKUP_COMPRESS` | `true` | Enable gzip compression |

### Database Variables (from .env)

| Variable | Used For |
|----------|----------|
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |
| `DB_USER` | Database user |
| `DB_PASS` | Database password |
| `DB_NAME` | Database name |

### Example .env Configuration

```bash
# Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETAIN=7          # Keep last 7 backups
BACKUP_COMPRESS=true     # Compress with gzip
```

---

## Automation

### Cron Job (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Daily backup at 2:00 AM
0 2 * * * cd /path/to/backend && node scripts/backup.js >> /var/log/avtraders-backup.log 2>&1

# Hourly backup (for critical periods)
0 * * * * cd /path/to/backend && node scripts/backup.js >> /var/log/avtraders-backup.log 2>&1

# Weekly backup with different retention
0 3 * * 0 cd /path/to/backend && BACKUP_RETAIN=30 node scripts/backup.js >> /var/log/avtraders-backup.log 2>&1
```

### Systemd Timer (Alternative to Cron)

```ini
# /etc/systemd/system/avtraders-backup.timer
[Unit]
Description=AV Traders Database Backup Timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/avtraders-backup.service
[Unit]
Description=AV Traders Database Backup

[Service]
Type=oneshot
User=deploy
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node scripts/backup.js
Environment=NODE_ENV=production
```

```bash
# Enable and start
sudo systemctl enable avtraders-backup.timer
sudo systemctl start avtraders-backup.timer

# Check status
sudo systemctl status avtraders-backup.timer
```

### PM2 Cron (If using PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'avtraders',
    script: 'server.js',
    cron_restart: '0 2 * * *',  // Restart daily at 2 AM
  }],
  // Use separate cron for backups
};
```

---

## Backup Details

### What Gets Backed Up

The `mysqldump` command includes:

| Option | What It Captures |
|--------|------------------|
| `--single-transaction` | Consistent snapshot (InnoDB) |
| `--routines` | Stored procedures and functions |
| `--triggers` | Table triggers |
| `--events` | Scheduled events |
| `--add-drop-table` | DROP TABLE before CREATE |
| `--create-options` | ENGINE, CHARSET, etc. |
| `--set-charset` | Character set information |

### Output Files

Each backup creates up to 2 files:

```
backups/
├── avtraders_2024-06-12T14-30-00.sql.gz    # Compressed backup
└── avtraders_2024-06-12T14-30-00.meta.json  # Metadata
```

**Metadata file example:**
```json
{
  "database": "avtradersdb",
  "host": "46.28.44.56",
  "timestamp": "2024-06-12T14:30:00.123Z",
  "file": "avtraders_2024-06-12T14-30-00.sql.gz",
  "size": 2568923,
  "compressed": true
}
```

### Compression

When `BACKUP_COMPRESS=true`:

- Uses gzip compression
- Typical compression ratio: 70-90% reduction
- 10 MB database → 1-3 MB compressed

When `BACKUP_COMPRESS=false`:

- Plain SQL file
- Faster backup/restore
- Larger file size

---

## Retention Policy

### How It Works

1. After each backup, list all `.sql` and `.sql.gz` files
2. Sort by modification time (newest first)
3. Delete files beyond `BACKUP_RETAIN` count
4. Also delete associated `.meta.json` files

### Example

With `BACKUP_RETAIN=7`:

```
Day 1: 7 backups (all kept)
Day 2: 8 backups (oldest deleted, 7 kept)
Day 3: 8 backups (oldest deleted, 7 kept)
...
```

### Different Retention for Different Periods

```bash
# Daily backups: keep 7
0 2 * * * BACKUP_RETAIN=7 node scripts/backup.js

# Weekly backups: keep 4
0 3 * * 0 BACKUP_DIR=./backups/weekly BACKUP_RETAIN=4 node scripts/backup.js

# Monthly backups: keep 12
0 4 1 * * BACKUP_DIR=./backups/monthly BACKUP_RETAIN=12 node scripts/backup.js
```

---

## Verification

### What Gets Verified

The `--verify` flag checks:

| Check | Description |
|-------|-------------|
| File size | Must be > 100 bytes |
| CREATE TABLE | SQL contains table definitions |
| INSERT statements | SQL contains data |
| mysqldump header | SQL was generated by mysqldump |
| Content length | SQL is substantial (> 1000 chars) |

### When to Verify

- After manual backup
- Before critical operations
- Periodically via cron
- After system issues

```bash
# Verify latest backup
npm run backup:verify

# Verify specific backup
node scripts/backup.js --verify ./backups/avtraders_2024-06-12T14-30-00.sql.gz
```

---

## Restore

### Full Restore

```bash
node scripts/backup.js --restore ./backups/avtraders_2024-06-12T14-30-00.sql.gz
```

### What Happens During Restore

1. **Warning displayed** — confirms database name
2. **Decompresses** backup (if .gz)
3. **Pipes to mysql** client
4. **Overwrites** existing database
5. **Confirms** completion

### Partial Restore

For restoring specific tables:

```bash
# Extract backup
gunzip -c ./backups/avtraders_2024-06-12T14-30-00.sql.gz > /tmp/backup.sql

# Edit and restore specific tables
mysql -u appuser -p avtradersdb < /tmp/backup.sql
```

### Point-in-Time Recovery

For recovery between backups, use MySQL binary logs:

```bash
# Enable binary logging in my.cnf
# log_bin = /var/log/mysql/mysql-bin

# Restore base backup
node scripts/backup.js --restore ./backups/avtraders_2024-06-12T02-00-00.sql.gz

# Apply binary logs up to point of failure
mysqlbinlog --stop-datetime="2024-06-12 14:30:00" /var/log/mysql/mysql-bin.* | mysql -u root -p
```

---

## Monitoring

### Log Backup Results

```bash
# In crontab
0 2 * * * cd /path/to/backend && node scripts/backup.js >> /var/log/avtraders-backup.log 2>&1

# Rotate logs
# /etc/logrotate.d/avtraders-backup
/var/log/avtraders-backup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
```

### Email Notifications

```bash
#!/bin/bash
# scripts/backup-and-notify.sh

RESULT=$(node scripts/backup.js 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "$RESULT" | mail -s "AV Traders Backup FAILED" admin@example.com
fi
```

### Health Check Script

```bash
#!/bin/bash
# scripts/check-backup.sh

BACKUP_DIR="./backups"
LATEST=$(ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
    echo "CRITICAL: No backups found!"
    exit 2
fi

# Check if backup is older than 25 hours
MAX_AGE=$((25 * 60 * 60))
FILE_AGE=$(($(date +%s) - $(stat -c %Y "$LATEST")))

if [ $FILE_AGE -gt $MAX_AGE ]; then
    echo "WARNING: Latest backup is older than 25 hours"
    exit 1
fi

echo "OK: Latest backup is $(basename $LATEST)"
exit 0
```

---

## Best Practices

### 1. Test Restores Regularly

```bash
# Monthly restore test
# 1. Restore to test database
BACKUP_DIR=./backups TEST_DB=avtraders_test node scripts/backup.js --restore ./backups/latest.sql.gz

# 2. Verify data integrity
mysqldump avtraders_test | md5sum
mysqldump avtradersdb | md5sum
```

### 2. Store Backups Off-Site

```bash
# Sync to S3 after backup
0 2 * * * cd /path/to/backend && node scripts/backup.js && aws s3 sync ./backups s3://my-bucket/backups/

# Or use rsync
0 2 * * * cd /path/to/backend && node scripts/backup.js && rsync -av ./backups backup-server:/backups/
```

### 3. Encrypt Sensitive Backups

```bash
# Encrypt backup
gpg --encrypt --recipient admin@example.com ./backups/avtraders_2024-06-12T14-30-00.sql.gz

# Decrypt for restore
gpg --decrypt ./backups/avtraders_2024-06-12T14-30-00.sql.gz.gpg > ./backups/decrypted.sql.gz
```

### 4. Monitor Backup Size

```bash
# Alert if backup size changes significantly
PREV_SIZE=$(cat ./backups/.last_size 2>/dev/null || echo 0)
CURR_SIZE=$(stat -c %s ./backups/avtraders_*.sql.gz | tail -1)

# Check if size changed by more than 50%
THRESHOLD=$((PREV_SIZE / 2))
if [ $CURR_SIZE -lt $THRESHOLD ]; then
    echo "WARNING: Backup size decreased significantly!"
fi

echo $CURR_SIZE > ./backups/.last_size
```

### 5. Document Recovery Procedures

Create a runbook:

```markdown
## Database Recovery Procedure

### Prerequisites
- SSH access to server
- Database credentials
- Latest backup location

### Steps
1. Stop the application
2. Identify the backup to restore
3. Run restore command
4. Verify data integrity
5. Start the application
6. Monitor for issues

### Emergency Contacts
- DBA: dba@example.com
- DevOps: devops@example.com
```

---

## Troubleshooting

### Backup Fails with Access Denied

```
mysqldump: Got error: 1045: Access denied
```

**Solution:**
- Verify `DB_USER` and `DB_PASS` in `.env`
- Ensure user has `SELECT`, `SHOW VIEW`, `TRIGGER`, `LOCK TABLES` privileges

```sql
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES ON avtradersdb.* TO 'appuser'@'%';
```

### Backup File is Empty

```
[backup] Backup file suspiciously small (0 bytes)
```

**Solution:**
- Check database connection
- Verify database name exists
- Check disk space

### Restore Fails

```
ERROR 1064 (42000) at line 1: You have an error in your SQL syntax
```

**Solution:**
- Verify backup file is not corrupted
- Check MySQL version compatibility
- Try restoring with `--force` flag

### Permission Denied on Backup Directory

```
Error: EACCES: permission denied, mkdir './backups'
```

**Solution:**
```bash
mkdir -p ./backups
chmod 755 ./backups
chown $(whoami) ./backups
```

---

## Resources

- [mysqldump Documentation](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)
- [MySQL Backup Strategies](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)
- [Backup Best Practices](https://www.percona.com/blog/mysql-backup-best-practices/)
