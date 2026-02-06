# 2026-02-06

- [ ] during the import process we currently skip duplicates, but really we should replace duplicates because
it might be that we have uploaded partial data for a day (like the day when we are fetching the data). so really
that day's consumption will be available the next day and so should be overwritten later when we upload new data

