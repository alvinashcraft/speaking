# CFP tracker

Data for the **CFP tracker** canvas (`.github/extensions/cfp-tracker`), which aggregates open calls for speakers and ranks them against my speaking interests.

- `profile.json` – interest keywords and weights, preferred confs.tech topics, exclusions. Edit to tune ranking.
- `tracking.json` – per-CFP status (`saved`, `submitted`, `accepted`, `rejected`, `dismissed`) with notes, plus manually added CFPs. Updated from the canvas.

## Sources

| Source | Access | Notes |
|---|---|---|
| [Calling All Papers](https://api.callingallpapers.com/v1/cfp) | JSON API | Aggregates Sessionize and PaperCall public CFPs with timezones. |
| [developers.events](https://developers.events/all-cfps.json) | JSON | Community-maintained; includes historical CFPs, filtered by deadline. |
| [confs.tech](https://github.com/tech-conferences/conference-data) | JSON on GitHub | Per-topic files (e.g. `dotnet`), used for topic matching. |
| [Leon Adato's CFP tracker](https://adatosystems.com/cfp-tracker/) | HTML table | Scraped; may break if the page layout changes. |
| [CFP Watch](https://cfp.watch/) | HTML cards | Scraped; small and not always current. |
| [Sessionize Discover](https://sessionize.com/app/speaker/discover) | Login required | No public API; add matches manually in the canvas. |

CFPs are deduplicated by submission URL and by name/year. When sources disagree on a deadline, the earliest is shown and flagged. Single-source listings are marked for verification.
