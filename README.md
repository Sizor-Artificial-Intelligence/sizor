### PRUEBAS PARA PAGOS CON BOLD
Llave de identidad: UIte3k23Tl26fFPvHtKkgO_JpnPyMYAomI_e1JkhuMI
URL WEBHOOK: https://landazuriapps.com/api/webhooks/payment

### Para migraciones iniciales

- npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/000000_baseline/migration.sql
- npx prisma migrate resolve --applied 000000_baseline

- npx prisma migrate dev --name name_the_migration
