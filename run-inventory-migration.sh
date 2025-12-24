#!/bin/bash

# Run inventory migration
echo "Creating inventory tables..."

# You need to run this SQL in your Supabase dashboard SQL editor:
cat database/migrations/0003_create_inventory_tables.sql

echo ""
echo "Copy the above SQL and run it in your Supabase SQL editor to create inventory tables."
echo "Then the inventory system will work properly."