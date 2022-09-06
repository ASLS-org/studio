# Fixture Library
## Updating Fixture List
### 
Place your OFL-formated JSON fixture files within a folder which name should be the manufacturer's **unique name** as follows.
```
ASLS_STUDIO
└───public
│   └───fixtures
|        └───manufacturer-name
|            │   OFL-fixture.json

```
## Regenerating Fixture List
In order to apply modifications (Add/remove manufacturer and/or fixtures) you must run the following command:

```console
foo@bar:~/ASLS_STUDIO/public/fixtures$ node update_fixturelist.js
```