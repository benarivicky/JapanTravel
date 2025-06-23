# **App Name**: טיול ליפן

## Core Features:

- User Authentication: Login using email and password with Firebase Authentication. Store the TripId locally for app-wide access.
- Daily View: Display trip days from collection tripPlans using TRIPID = TripId as right to left horizontal scrollable cards, sorted by date and timeSegmentNumeric. Show time segments within each date, with field summary.
- Detailed Daily View: Show full details for the selected time segment with vertical scroll. Render HTML from the detailedContent field.
- External Links: Display clickable external links (linkTitle and linkLink) within the Detailed Daily View.
- Navigation: Track navigation path to ensure correct back behavior from Detailed Daily View to Daily View.

## Style Guidelines:

- Primary color: Soft blue (#E1E9FF). Alice Blue is a good starting point, but slightly darken/desaturate for less harsh contrast, to maintain an airy and calm aesthetic, referencing Japan's serene landscapes.
- Background color: Very light blue (#F8FAFD). Slightly desaturated and brightened version of the primary color to create a soft, unobtrusive backdrop.
- Accent color: Pale violet (#E1D5FF). An analogous color that adds a gentle contrast, useful for highlighting interactive elements. It maintains the calm tone, moving toward the left on the color wheel from blue.
- Body and headline font: 'Fredoka', sans-serif (user specified)
- All titles, fields, and content should be aligned right-to-left (RTL) to support the Hebrew language.
- Ensure that the Daily View uses a horizontal scrollable layout for the day cards to provide an intuitive user experience.