# Badges
Show the world that your package passes the Corp-Check tests! By putting the "recommended" badge in your package README, you can notify developers that it is safe to use your module: it has proper licensing, it is actually released and you care about its popularity.

## How to use
This is an example Recommended Badge for [Repatch](https://www.npmjs.com/package/repatch) [![corp-check status](https://api.corp-check.corpjs.com/badge?name=repatch)](https://corp-check.corpjs.com/result?name=repatch)

```
[![corp-check status](https://api.corp-check.corpjs.com/badge?name=repatch)](https://corp-check.corpjs.com/result?name=repatch)
```

This is an Accepted sample Badge, meaning warnings have been found but no serious issues:

This is how a Rejected sample Badge looks like:

## Api endpoint for badges:
```
https://api.corp-check.corpjs.com/badge?name=repatch
```

## Url for the Corp-Check result:
```
https://corp-check.corpjs.com/result?name=repatch
```

## Usable query parameters
- scope
- name
- version _(badge for specific version of module)_
```
https://corp-check.corpjs.com/result?scope=types&name=node&version=8.0.49
https://api.corp-check.corpjs.com/badge?scope=types&name=node&version=8.0.49
```
