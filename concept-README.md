# Corp-Check

## Motivation

The Node package management has unpredictable dangers. These dangers mostly stem from that the developers of the packages do not provide proper maintenance. Sometimes they do not keep the versioning rules, and a package might break below a minor or patch upgrade. These troubles are unpredictable, but the probability of that is mostly predictable. For example, if you rely on a package that is never released above 1.0, you probably use a beta version or the maintainer is not enough prudent, and you can not expect a proper maintenance in the future. Popularity should be treated in the same way, which may be a guarantee of the quality.

Even the license should be handled with care, which one is should be a barrier factor to use a package. Notice that not only the direct dependency can carry a breaking license. We also should keep in mind its dependencies license information.

## Concept

The principal creed should be:

**Every module is just as weak as its weakest dependency**

This statement is true likewise for every application, every service, etc.

Corp-Check provides an open-source solution for these problems above. **Corp-Check validates a given NPM module or a `package.json` including dependencies in its entire depth.** It has two available interfaces for use:

## Corp-Check [Web Application](https://corp-check.corpjs.com/npm)

This is useful for quick check an NPM package or a `package.json`. The application summarizes the result in descriptive forms.

<img alt="summary" src="https://resources.corp-check.corpjs.com/pics/summary.png" width="100%" />

The application is also be able to show the result in a detailed interactive view:

<img alt="detailed-view" src="https://resources.corp-check.corpjs.com/pics/detailed-view.png" width="100%" />

## Corp-Check [Command Line Interface](https://www.npmjs.com/package/corp-check-cli)

The CLI is also able to check NPM packages with

```
corp-check npm redux
```

but its greatest power is not there. The CLI's primary function is tight bounded to a project as a build or deploy phase. You can define an NPM script like:

```json
{
  ...
  "scripts": {
    "corp-check": "corp-check ."
  },
  ...
}
```

and automatically run it before committing or pushing into a repository. The valid choice could be also to live in a deploy process flow.

## The basic process

The most appropriate way to checking is installing the examined package with NPM in a working directory, and then discovering the dependencies one by one. Corp-Check installs the dependencies deeply instead of flatly. This way we can keep hereafter the hierarchical information. Thereafter Corp-Check collects the most information about dependencies, which is possible: version, license, etc.

NPM keeps tracking popularity, quality and maintenance attributes in its registry. Corp-Check fetches all of these data and compiles an info packet. This packet is a complete, raw and serializable description about the root package and its dependencies.

This processes above is performed by worker services in isolated docker containers. After this, the worker clears its working directory completely.

## Evaluation

Evaluation works in a bit similar recursive way like collecting. Evaluations are made by **evaluators**. Evaluators are functional separated modules Those can return descriptive **ERROR**, **WARNING** and **INFO** logs for every package in the dependency hierarchy.

Besides evaluators also give a numeric score `[0..1]`, even every package in the hierarchy. These numeric scores will form the final score of the root package. Zero is the worst score, and `1` is the best that can be given, and any intermediate decimal numbers are also accepted.

Every package in the hierarchy has a local final score that are formed by the following method:

<!-- s_f^p = \min_{d} \left\{ \prod_{e} s_e, \sqrt{A s_f^d} \right\} -->

![score-equation](https://resources.corp-check.corpjs.com/pics/score-calc2.png)

First the scores - given by the evaluators - are multiplied to each other. That makes the self-score of a package. The final score is made by taking the minimum of the self-score and the root squares of its first direct dependencies' final score. In the equation, `A` is a free parameter. This makes the method tunable. For now, fix it to `1`.

As we can see this scoring algorithm is a recursive algorithm, which has some important considered aspect:

1) The final score of the root package is also formed by this equation. This is the final score of the entire evaluation.
2) The root square performs a weakening effect upwards the dependency hierarchy. That increases the dependencies' final score a bit if they are between `0` and `1`.
3) If any evaluator gives `0` score, then the root final score will also be `0`.

Notice, that the `0` is a special score. This value is reserved for the errors.

### Qualification

Corp-Check gives a nominal qualification for the examined root package. This is determined by the root final score:

- **RECOMMENDED** - if the root final score is greater than `0.5`
- **ACCEPTED** - if the root final score is less then `0.5` and greater than `0`
- **REJECTED** - if the root final score is `0`

### Evaluation example

Assume that we have the following dependency hierarchy:

<img alt="hierarchy" src="https://resources.corp-check.corpjs.com/pics/hierarchy.png" height="150px"/>

For now, we have the following evaluators:

- **License** - checks the license validity for every package
- **Version** - checks the version validity for every package
- **Attribute** - judges every package by popularity (p), quality (q) and maintenance (m)

And they give the following scores:

<!--
|                 | A   | B   | C   | D   |
|-----------------|-----|-----|-----|-----|
| License score   | 1   | 1   | 1   | 0   |
| Version score   | 1   | 0.5 | 1   | 1   |
| Attribute score | 0.4 | 0.3 | 0.6 | 0.7 |
-->

<table>
  <tr>
    <td></td>
    <td><b>A</b></td>
    <td><b>B</b></td>
    <td><b>C</b></td>
    <td><b>D</b></td>
  </tr>
  <tr>
    <td>License score</td>
    <td>1</td>
    <td>1</td>
    <td>1</td>
    <td>0</td>
  </tr>
  <tr>
    <td>Version score</td>
    <td>1</td>
    <td>0.5</td>
    <td>1</td>
    <td>1</td>
  </tr>
  <tr>
    <td>Attribute score</td>
    <td>0.4</td>
    <td>0.3</td>
    <td>0.6</td>
    <td>0.7</td>
  </tr>
</table>

Then the self-score of `D` is `0 × 1 × 0.7 = 0`. Its final score is the same because it does not have any dependency. The self-score of `C` is `0.6`, but its final score is `0`, because the minimum of `0.6` and `√0` is `0`. By following this line of thought we can consider that `A` also takes zero as the final score. Notice, that the final score of `A` is the root final score.

We can imagine the zero score as a poison, which kills the entire tree.

<img alt="zero-effect" src="https://resources.corp-check.corpjs.com/pics/zero-effect.png" height="150px"/>

### The attribute score

NPM gives `popularity`, `quality` and `maintance` attributes for the packages. The Attribute evaluator makes its score by their weighted sum:

<!-- s_A = \frac{w_p p + w_q q + w_m m}{w_p + w_q + w_m} -->

![npm-scores](https://resources.corp-check.corpjs.com/pics/npm-scores.png)

## Rules of evaluation

The evaluators are tunable by rules. Every evaluator has an own rule configuration, and the collection of these rule configurations form the ruleset within a `.json` file.

Corp-Check has a [corporate ruleset](https://github.com/jaystack/corp-check-rest/blob/master/default-rules.json), which is used by default. You can override and modify the primary behavior of Corp-Check evaluations by any slice of these rules. For example, you can specify your preferred licenses in your evaluation, the weight of the attributes of packages, or you can entirely turn off errors by version check. This way you can define your own rules for your project or for your whole company.

## Caching

Already we met some primary entities, like:

- **PACKAGE INFO** - The collected info about packages after installation. This is a recursive data structure.
- **EVALUATION** - This is also a recursive data structure about the evaluation result including every score and logs about the package and its all dependencies.
- **RULESET** - The configuration of evaluation.

Corp-Check services are keeping in the cache, the package info and the related evaluations with its ruleset. This makes it possible, that for creating another evaluation with a different ruleset, Corp-Check does not need to collect again the package info. But running twice the same evaluation with the same ruleset provides the same evaluation from the cache.

Of course, cache has the expiration, which ensures, that upgrading deeply nested dependencies can cause change for the complete evaluation, similar to changing the popularity or any other attributes.

Notice, that the cache is bounded to a specified version of an NPM module.

The Corp-Check services have two emphatic expiration timeout:

- The package **attribute values** from NPM are cached for **a week**.
- An **evaluation** tied to a specified version and ruleset are cached for **30 days**.