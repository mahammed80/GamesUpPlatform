# Complete Inventory Seeder

This seeder creates 6 complete products with full digital inventory data for your Products Inventory table.

## Products Added:

1. **Marvel's Spider-Man 2** (2 digital items)
   - Email: spiderman@psn-account.com, milesmorales@psn-account.com
   - Region: US
   - Online IDs: SpiderManPlayer, MilesMorales
   - 5 code slots each (Primary PS4/PS5, Secondary, Offline PS4/PS5)

2. **God of War Ragnarök** (1 digital item)
   - Email: kratos@psn-account.com
   - Region: EU
   - Online ID: KratosPlayer
   - 5 code slots

3. **Horizon Forbidden West** (1 digital item)
   - Email: aloy@psn-account.com
   - Region: UK
   - Online ID: AloyHunter
   - 5 code slots

4. **The Last of Us Part I** (2 digital items)
   - Email: joel@psn-account.com, ellie@psn-account.com
   - Region: US
   - Online IDs: JoelSurvivor, EllieWilliams
   - 5 code slots each

5. **Gran Turismo 7** (1 digital item)
   - Email: gtplayer@psn-account.com
   - Region: JP
   - Online ID: GT7Racer
   - 5 code slots

6. **Demon's Souls** (1 digital item)
   - Email: demon@psn-account.com
   - Region: EU
   - Online ID: DemonSlayer
   - 5 code slots

## Running the Seeder

```bash
cd server
node seed-complete-inventory.js
```

## Data Structure

Each digital item includes:
- **Email**: PlayStation Network email
- **Password**: Account password
- **Code**: Primary activation code
- **Outlook Email**: Recovery email
- **Outlook Password**: Recovery password
- **Birthdate**: Account birthdate
- **Region**: Account region (US, EU, UK, JP)
- **Online ID**: PlayStation Online ID
- **Backup Codes**: Additional backup codes
- **Slots**: 5 different code slots for different platforms/types
- **Total Codes**: Number of codes available

## Summary

- **6 Products** with complete digital data
- **8 Digital Items** total
- **55 Total Stock Slots** (8 items × 5 slots each + 3 extra for Spider-Man)
- **All fields populated**: Email, Sony Pass, Email-Pass, Region, Online ID

This will completely populate your Products Inventory table with realistic data that displays all columns properly.
