# 2026-02-06

- [x] during the import process we currently skip duplicates, but really we should replace duplicates because
      it might be that we have uploaded partial data for a day (like the day when we are fetching the data). so really
      that day's consumption will be available the next day and so should be overwritten later when we upload new data
- [x] add a feature to be able to insert data by pasting text into a text area
- [x] add a simple navigation bar at the top of all pages so that we can jump back to import route at any point
