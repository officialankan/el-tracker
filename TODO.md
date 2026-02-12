# 2026-02-06

- [x] during the import process we currently skip duplicates, but really we should replace duplicates because
      it might be that we have uploaded partial data for a day (like the day when we are fetching the data). so really
      that day's consumption will be available the next day and so should be overwritten later when we upload new data
- [x] add a feature to be able to insert data by pasting text into a text area
- [x] add a simple navigation bar at the top of all pages so that we can jump back to import route at any point
- [ ] add a toggle for showing or not showing the target in weekly, monthly and year view. adjust the y axis scale reactivly on the toggle
- [ ] in the patterns page, add a feature that lets the user determine what period
      (a particular month, a particular year) that the patterns are based on. currently they are based on all available data
- [ ] in the patterns pagae after implementing the TODO above, implement a feature that lets the user compare
      patterns between two data source periods. like how the weekday pattern compares between two specific months.
- [ ] in the patterns page heat map add a "1 month" view
