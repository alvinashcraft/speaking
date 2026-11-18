# CFP tracker

Data for the **CFP tracker** canvas (`.github/extensions/cfp-tracker`), which aggregates open calls for speakers and ranks them against my speaking interests.

- `profile.json` – interest keywords and weights, preferred confs.tech topics, exclusions. Edit to tune ranking.
- `tracking.json` – per-CFP status (`saved`, `submitted`, `accepted`, `rejected`, `dismissed`) with notes, plus manually added CFPs. Updated from the canvas.

## Sources

| Source | Access | Notes |
|---|---|---|
| [Open Tech CFPs](https://github.com/1kevgriff/OpenTechCFPs) | JSON | Public Sessionize CFPs, refreshed often. Data © Open Tech CFPs, [CC BY 4.0](https://github.com/1kevgriff/OpenTechCFPs/blob/main/LICENSE-DATA). Its broad categories (e.g. `ai`, `cloud`) count at half weight. |
| [developers.events](https://developers.events/all-cfps.json) | JSON | Community-maintained; includes historical CFPs, filtered by deadline. |
| [cfp.ninja](https://cfp.ninja/) | JSON API | Open-source CFP platform; tags include travel/hotel/honorarium perks. |
| [confs.tech](https://github.com/tech-conferences/conference-data) | JSON on GitHub | Per-topic files (e.g. `dotnet`), used for topic matching. |
| [JavaConferences](https://javaconferences.org/) | JSON | Java-focused (CC0). |
| [PythonDeadlin.es](https://github.com/jesperdramsch/python-deadlines) | YAML on GitHub | Python-focused (MIT); uses the extended deadline when present. |
| [Leon Adato's CFP tracker](https://adatosystems.com/cfp-tracker/) | HTML table | Scraped; may break if the page layout changes. |
| [CFP Watch](https://cfp.watch/) | HTML cards | Scraped; small and not always current. |
| [Sessionize Discover](https://sessionize.com/app/speaker/discover) | Login required | No public API; Open Tech CFPs covers many public Sessionize CFPs, add others manually in the canvas. |

Calling All Papers is not used: its API's `robots.txt` disallows all automated clients. Source research credit: [sujee/cfp-tracker](https://github.com/sujee/cfp-tracker/blob/main/docs/cfp-sources.md).

CFPs are deduplicated by submission URL and by name/year. When sources disagree on a deadline, the earliest is shown and flagged. Single-source listings are marked for verification.
