# Rule configuration

Corp-Check evaluations are made by **evaluators**. Evaluators are functional separated modules that can return *error*, *warning* and *info* logs, and can give sub-scores to the package. These sub-scores are multiplied to each other, and these multiplied scores constitute the final score of the evaluated package including its dependencies' scores.

Every evaluator is configurable by their rules. They make the entire **ruleset**. The ruleset is defined in `json` format:

```
{
  [evaluatorName]: {
    ... evaluator rules ...
  }
}
```

## Evaluators

### License rules

This defines the ruleset of license validation. If there's a not allowed license in any of the dependencies, it yields an error.

The property set is:

- **`include`**: `string[]` - Defines allowed licenses.
- **`exclude`**: `string[]` - Unallows specified licenses.
- **`licenseRequired`**: `boolean` - If `true` and no license is found in the package, the evaluator throws an error.
- **`depth`**: `number` - Determines the depth of the evaluation. `0` is the package itself, `1` means the first dependencies, etc. Set it `null` to interpret as infinity.

Example:

```json
{
  "license": {
    "include": ["MIT"],
    "exclude": ["GPL-2.0"],
    "licenseRequired": true,
    "depth": 3
  }
}
```

### Version rules

This performs the version validation. If an unreleased package is found in the first dependencies it yields an error; while it only sends a warning if it was found in a deeper dependency.

The property set is:

- **`minVersion`**: `string[]` - Defines the minimum accepted version that is required in a package.
- **`isRigorous`**: `boolean` - If `true`, the evaluator yields an error if a package was found with version number less than `minVersion`.
- **`rigorousDepth`**: `number` - Determines how rigorous the validation is. `0` means it's only the package itself, `1` means it also inspect the first dependencies, and so on.
- **`retributionScore`**: `number` - This score is given to the package which is below the `minVersion`, if the checking is not rigorous.

Example:

```json
{
  "version": {
    "minVersion": "1.0.0",
    "isRigorous": true,
    "rigorousDepth": 1,
    "retributionScore": 0.5
  }
}
```

### NpmScores rules

This provides the `popularity`, `quality` and `maintenance` scores. The final value of the `npmScores` is calculated using weighted average.

The property set is:

- **`qualityWeight`**: `number`
- **`popularityWeight`**: `number`
- **`maintenanceWeight`**: `number`

Example:

```json
{
  "npmScores": {
    "qualityWeight": 1,
    "popularityWeight": 0.7,
    "maintenanceWeight": 0.5
  }
}
```

## The default corporate ruleset

Find [here](https://raw.githubusercontent.com/jaystack/corp-check-rest/master/default-rules.json).

## Notes
Keen-eyed developers will realize that some of the dependencies of Corp-Check CLI yield warnings. Thankfully, it happens because of version checks, not licensing ones. This clearly show that while our open-source world is far from being ideal, each and every one of us make what we can to establish a transparent and clear ecosystem. To avoid any problems, Corp-Check CLI still passes the check when you use corp-check-cli as a dependency.