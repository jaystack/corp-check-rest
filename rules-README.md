# Rule configuration

Corp-Check evaluations are made by **evaluators**. Evaluators are functional separated modules that can return error, warning and info logs, and can give sub-scores to the package. These sub-scores are multiplied to each other, and these multiplied scores constitute the final score of the evaluated package including its dependencies' scores.

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

That makes the license validation. It throws error, if unallowed license was found in the dependency hierarchy.

The property set is:

- **`include`**: `string[]` - Defines allowed licenses.
- **`exclude`**: `string[]` - Unallows specified licenses.
- **`licenseRequired`**: `boolean` - If `true` and no license found at a package, the evaluator throws error.
- **`depth`**: `number` - Determines the depth of the evaluation. `0` is the package itselft, `1` means the first dependencies, etc. Set it `null` to interpret as infinity.

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

That makes the version validation. It throws error, if unreleased package was found in the first dependencies, and send warning, if they were found deeper.

The property set is:

- **`minVersion`**: `string[]` - Defines the minimum version that is required from a package.
- **`isRigorous`**: `boolean` - If `true`, the evaluator throws error if package was found below the `minVersion`.
- **`rigorousDepth`**: `number` - Determines the depth of the rigorous check. `0` is the package itself, `1` means the first dependencies, etc.
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

That provides the `popularity`, `quality` and `maintance` scores. The final score of the `npmScores` is calculated by weighted average.

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