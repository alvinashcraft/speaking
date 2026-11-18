# CFP tracker

Data for the **CFP tracker** canvas (`.github/extensions/cfp-tracker`), which aggregates open calls for speakers and ranks them against my speaking interests.

- `profile.json` – interest keywords and weights, preferred confs.tech topics, exclusions, and session `languages` (default `["english"]`). Edit to tune ranking.
- `tracking.json` – per-CFP status (`saved`, `submitted`, `accepted`, `rejected`, `dismissed`), notes, retained event details and matching aliases, plus manually added CFPs. Updated from the canvas.

## Sources

| Source | Access | Notes |
|---|---|---|
| [Open Tech CFPs](https://github.com/1kevgriff/OpenTechCFPs) | JSON | Public Sessionize CFPs, refreshed often. Data © Open Tech CFPs, [CC BY 4.0](https://github.com/1kevgriff/OpenTechCFPs/blob/main/LICENSE-DATA). Its broad categories (e.g. `ai`, `cloud`) count at half weight. |
| [developers.events](https://developers.events/all-events.json) | JSON | Community-maintained; includes historical CFPs, filtered by deadline. The only source with session-language tags. |
| [cfp.ninja](https://cfp.ninja/) | JSON API | Open-source CFP platform; tags include travel/hotel/honorarium perks. |
| [confs.tech](https://github.com/tech-conferences/conference-data) | JSON on GitHub | Per-topic files (e.g. `dotnet`), used for topic matching. |
| [JavaConferences](https://javaconferences.org/) | JSON | Java-focused (CC0). |
| [PythonDeadlin.es](https://github.com/jesperdramsch/python-deadlines) | YAML on GitHub | Python-focused (MIT); uses the extended deadline when present. |
| [Leon Adato's CFP tracker](https://adatosystems.com/cfp-tracker/) | HTML table | Scraped; may break if the page layout changes. |
| [CFP Watch](https://cfp.watch/) | HTML cards | Scraped; small and not always current. |
| [Sessionize Discover](https://sessionize.com/app/speaker/discover) | Login required | No public API; Open Tech CFPs covers many public Sessionize CFPs, add others manually in the canvas. |

Calling All Papers is not used: its API's `robots.txt` disallows all automated clients. Source research credit: [sujee/cfp-tracker](https://github.com/sujee/cfp-tracker/blob/main/docs/cfp-sources.md).

CFPs are deduplicated by submission URL and name, without merging distinct dated editions. Undated records only match an unambiguous edition. When sources disagree on a deadline, the earliest is shown and flagged; the CFP remains visible while any reported deadline is open. Single-source listings are marked for verification.

Tracked CFP details and aliases are retained so statuses and notes survive source changes or disappearing listings. Retained details may be outdated, so verify them against the event's CFP. Legacy tracking entries acquire retained details when their CFP is next available.

CFPs are hidden by default only when a source lists their languages and none of them is in `profile.languages`. Events tagged with several languages (e.g. French and English) and events with no language data stay visible. Choose **Any language** in the canvas to show everything; tracked CFPs are always shown.
