[![MadeWithVueJs.com shield](https://madewithvuejs.com/storage/repo-shields/4381-shield.svg)](https://madewithvuejs.com/p/asls-studio/shield-link)
# What is ASLS Studio

[ASLS Studio](https://studio.asls.timekadel.com) is an open-source, web-based, DMX lighting control software and visualizer.

> **Warning:**
The current distribution of ASLS Studio is in alpha status. Listed features are provided as-is, without any guarantee. Please report any issue over the project's repository. 


## Motivation

Part of ASLS (Autonomous Stage Lighting Systems) development, it was originally created to offer ways to program ASLS DMX nodes on the fly through a simple web-browser. Following the end of the project, it was decided to release the project as an open-source, free to use platform for anyone to enjoy. 

## Features

ASLS Studio comes with standard DMX lighting control software features such as Universe patching, Fixture grouping, Scene generation, Effect engines, Show Emulation and much more. The following manual aims to guide you through each individual feature.


# Installation

The alpha version of ASLS Studio is presently available to download through it's [repository](https://github.com/ASLS-org/studio.git). An executable version of the software should be released during beta state.
This section will help you download and setup ASLS Studio on your machine.

> **Warning:**
The current distribution of ASLS Studio is in alpha status. Listed features are provided as-is, without any guarantee. Please report any issue over the project's repository. 

## Requirements

> **Info:**
As of today, there is no **"user-friendly"** installation script available to download. It is recommended to users that might not be familiar with [Git](https://git-scm.com/)/[GitHub](https://github.com/) and [Node.js](https://nodejs.org/en/) to read a bit about these tools before proceeding with the next steps.

In order for ASLS Studio to run on your machine, please make sure that you meet the following minimum system specifications:

### Hardware

- 4GB of RAM (8GB or more recommended)
- Integrated graphics with WebGL 1.0 / WebGL 2.0 support (A dedicated GPU is recommended)

### Software
- [Node.js](https://nodejs.org/en/) v16.15.1 or upper
- Latest version of one of the following browsers: [Chrome](https://www.google.com/chrome/), [Firefox](https://www.mozilla.org/en-US/firefox/new/), [Opera](https://www.opera.com/download)
  

## Download and install

Browse to the path of your choice and run the following command from a terminal:

```
$ git clone https://github.com/ASLS-org/studio.git
```

Get to the project's root.
```
$ cd studio
```

Install package dependencies.
```
$ npm install
```

## Start Environment locally

Serve ASLS Studio in the local server.
```
$ npm run serve
```

ASLS Studio will start a server at http://localhost:4515. Simply browse to the following URL using your favorite browser to be prompted with ASLS Studio's user interface.

## Build For Production

Build ASLS Studio from source.

```
$ npm run build
```

Built files will be located over the local `./dist` folder located at project root.

# Getting Started

Please refer to [ASLS Studio's manual](https://studio.asls.timekadel.com) for an in-depth guide on how to use this tool. 

> **Warning:**
Please note that this is an early alpha version. Documentation is still in progress. It will be updated following the next releases.
