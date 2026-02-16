# 2026-02-06

- [x] during the import process we currently skip duplicates, but really we should replace duplicates because
      it might be that we have uploaded partial data for a day (like the day when we are fetching the data). so really
      that day's consumption will be available the next day and so should be overwritten later when we upload new data
- [x] add a feature to be able to insert data by pasting text into a text area
- [x] add a simple navigation bar at the top of all pages so that we can jump back to import route at any point
- [x] add a toggle for showing or not showing the target in weekly, monthly and year view. adjust the y axis scale reactivly on the toggle
- [x] in the patterns page, add a feature that lets the user determine what period
      (a particular month, a particular year) that the patterns are based on. currently they are based on all available data
- [x] in the patterns pagae after implementing the TODO above, implement a feature that lets the user compare
      patterns between two data source periods. like how the weekday pattern compares between two specific months.
- [x] in the patterns page heat map add a "1 month" view
- [x] we now have analysis for **electric** consumption. i can access my **water** consumption data the same
      way. is it possible to toggle and do every analysis (view) but with water instead? should be straightforward and only require us to change label on y axes and tooltips. i think it would be neat to in the top menu bar where we now have "el tracker" we simply add a toggle to it so it can switch to "h2o tracker" and a new icon.
- [ ] **test water tracking**: import a water CSV file, verify toggle switches between El/H2O modes,
      check that monthly/yearly/patterns views show liters, weekly redirects to monthly, targets work per resource,
      and day-of-week chart is hidden in patterns for water
- [ ] in the patterns page when we select a specific month as a period, the plot "average by month" becomes irrelevant, so we should probably hide that if we are viewing a certain month.
- [ ] like the TODO above, the heatmap becomes a bit weird when we select a certain month as a period since the heatmap looks hard-coded to display severals months. can we fix it so that it updates accordingly? like when we select a specific month as a period then the heatmap should show the data as it is currently, but use the full width etc and have the "x axis" update to only show that months weeks.
- [x] much like the TODO above, some graphs in the patterns page are a bit obsolete when using the comparing periods feature. maybe put the "compare with" feature in a separate tab inside the patterns page so that it becomes a bit cleaner.
- [x] in the stats card, create a tooltip that can be activated by clicking a info icon by the "vs rolling average" stat that then explains what we mean by vs rolling average (i.e. what that rolling average is based on and what the number shows
- [x] add a feature that lets the user calculate electricy bill cost. this can be a new page/view. show the current month stats card and then let the user type in a price (SEK) per kWh, then display the cost of the current cumulative consumption and also the projected cost based on the projection.
- [x] currently, i think the rolling average includes zeros for missing dates within the window size. this means the it is a bit odd to compare against, so we shouldnt include those zeros (where dates have no data) in the rolling average calculation.
- [x] on the import page, show the 5 latest dates already imported
- [ ] on the import page, add a feature that let's the user detect missing dates within the database
