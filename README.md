# Spinners

Look at `app.module.ts` to see the example app.


## Overview of the Example App

### This is its router configuration.

```
RouterModule.forRoot([
  {path: "", pathMatch: "full", redirectTo: "/a/b"},
  {
    path: "a", component: ComponentA, children: [
      {path: "b", component: ComponentB, canActivate: ['canActivate']},
      {path: "bb", component: ComponentBB, canActivate: ['canActivate']}
    ]
  },
  {path: "aa", loadChildren: () => timer(1000).first().map(e => LazyLoaded) }
])
```

### There are two router outlets:

```
AppComponent has router-outlet
  ComponentA has router-outlet
```

Let's refer to them as the outer and the inner outlets.

### 2 Navigations

The user starts at '/a/b'. The user can navigate to '/a/bb' or to '/aa'.

The first navigation ('/a/b' => '/a/bb') is delayed by a guard but does not require us to load any configuration. Let's refer to is as the inner navigation because it updates the inner outlet.
The second navigation ('/a/b' => '/aa') is delayed by loadChildren. Let's refer to is as the outer navigation because it updates the outer outlet.

## Our Goal

Our goal is to show the spinner around the outer outlet during the outer navigation, and show the spinner around the inner outlet during the inner navigation.

### Assumptions

Let's assume the spinner directive is provided externally. For that directive to function correctly we should provide the following data structure:

```
changes: Route[][]
```

It is an array of paths from the root router configuration to a leaf that is being updated. How exactly the directive is implement is not important, but it is not hard to see that we will know which outlets will be updated using `changes`




## Correct Solution

We can always correctly handle the inner navigation. Before running the guards, we already have all the information about what guards we are going to run and what outlets will be affected. We can derive `changes: Route[][]` from it and either add it GuardsCheckStart or emit an entirely different event.

Because the router supports global redirects (e.g., `{path: '', redirectTo: '/other'}`), it is not possible to know what parts of the apps will be updated without loading all lazy-loadable configurations. Global redirects can completely change the provided URL, so we cannot make any assumptions about what will be updated. This means that we cannot handle the outer navigation correctly for all apps.




## Semi-Correct Solutions

### Use PreloadAllModules and a Global Spinner

If we use PreloadAllModules or a similar strategy, we can preload the modules before the user navigates there explicitly. If the user is super fast and clicks on a button before the right module is loaded, we can show a global spinner. For most desktop apps PreloadAllModules is a good strategy as the data/internet is "free" and fast. With this strategy in place, the chance of seeing a global spinner can be exceptionally low. 

Also, we don't have to use a spinner covering the whole app. We can annotate a section of the app that will be covered by the "global" spinner. We can also have more than one "global" spinner and decide which one should spin based on the URL. We don't want to make it too complex: two or three sections is probably good enough.

All the inner navigations will be able to show the spinner at the right place. 

### Pros

* Easy to implement (assuming inner navigations are handled by the router, and the sppiner directive is provided by the router)
* It is technically "correct", meaning that an router outlet, about to be updated, will always be covered by a spinner.

### Cons

* In some situations a large part of the app can be covered by the "global" spinner



### Calculating `changes: Route[][]` Manually

The router gives we a parsed URL tree when it starts navigating. We also have access to the current router state. This means that we can walk the two trees and calculate some approximation of `changes: Route[][]`.  

### Cons
* This value cannot be always correct because of lazy loading. 
* This calculation can also be complex. Router supports redirects, custom matchers, wildcards, named outlets. Implementing support for all of these is a lot of work and error prone. I think this route may make sense iff we support a small subset of router features, and if we see an unsupported feature (e.g., an empty path route with two children), we conservative assume the parent will change. We can also provide extra information in the router configuration that our tree walker will use.

### Pros
* If the app uses a subset of the router features, this solution can be precise. 

The router could also expose some form of recognize that does not call loadChildren. In this case we would get a new router state (that might be incorrect!!!), which we could use to calculate `changes: Route[][]`.



## Choosing Solution

I think the first option is better:

* Most navigations are inner navigations, so they will always be handled correctly.
* If we provision a few designated sections, we can make "global" spinner cover only the "expected" part of the app.
* If we set up PreloadAllModules, the user should almost never see global spinners.


## What We Should Not Do

It's not a bad idea to have some ad-hoc spinner positioning based on the URL, as described in "Use PreloadAllModules and a Global Spinner". What we should not do is making the link responsible for deciding what should spin.

The router is split into two parts:

* Triggering navigation/changing the URL
* Reacting to navigation

The user can click on a link, change the URL directly (via the back button), or use imperative navigation (i.e., router.navigate). All three should work in exactly the same way in regards to how the app react to them.
