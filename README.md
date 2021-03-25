# ANPR Benchmark

The ANPR (Automatic number-plate recognition) Benchmark is a tool that retrieves and compares vehicles plates (called events) captured by multiple ANPR cameras. The goal is to quickly know which camera has the best LPR (License Plate Recognition) success rate within a time period.

This tool is used with a ExpressJs backend (HTTP/REST API) to GET the events (plates) captured by the camera.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [NPM](https://www.npmjs.com/)

> The backend host must be set as an environment variable in local (variable REACT_APP_HOST) to be accessible from the Benchmark tool.

### Installing

```
$ git clone https://github.com/iemgroup/anpr-benchmark-web
$ cd anpr-benchmark-web
$ npm install
```

### Usage with Browser

```
npm start
```

### Desktop application (with ElectronJs)
```
npm run electron-pack
```
The executable will be in the *dist* folder at the root of the app.


## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [React](https://reactjs.org/)
* [NPM](https://www.npmjs.com/)
* [ElectronJs](https://www.electronjs.org/)

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **David Gonzalez** - Developer at [IEM SA](https://www.iemgroup.com/)