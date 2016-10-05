# Angular directives for d3 charts.

Check out the [demo](http://ng-d3-chart.herokuapp.com/).

This repo is for distribution on `npm` and `bower`.

## Install

You can install this package either with `npm` or with `bower`.

### npm

```shell

```

### bower

```shell

```
The library is then available at ``.

## Getting Started

Add reference to ng-d3-chart js and css
```html
<link rel="stylesheet" href="/bower_components/ng-d3-charts/ng-d3-charts.min.css">
<script src="/bower_components/ng-d3-charts/ng-d3-charts.min.js"></script>
```

Where you declare your app module, add ng-d3-charts:
```javascript
angular.module('myApp',[
	'ng-d3-charts',
]);
```
In your javascript file within the controller where you plan to use ng-d3-charts, declare:
```javascript
angular.controller('home',function($scope,chartConfig){
  //YouTube player configuration
	$scope.chartConfig = new chartConfig({});
});  
```
In your html file within the controller where you plan to use ng-d3-charts, add:


## Customization

## Test
