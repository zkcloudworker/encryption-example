# Example using client/worker encryption

An example with encryption between client and workers.

See the documentation at 
[Trust assumption: encrypting all the data that is being sent and stored](https://docs.zkcloudworker.com/privacy#trust-assumption-encrypting-all-the-data-that-is-being-sent-and-stored)

## Installation

You need to install `node (v20+)` and `git` and clone this repo in the same 
working dir where you installed the `zkcloudworker-local` repo.
For this examples we assume the working dir is `~/zkcloudworker`.
```
cd ~/zkcloudworker
git clone https://github.com/zkcloudworker/encryption-example
```

## Deploy

In the `zkcloudworker-local` folder, run:
```
cd ~/zkcloudworker
cd zkcloudworker-local
yarn deploy encryption-example
```

See the 
[zkcloudworker-local](https://github.com/zkcloudworker/zkcloudworker-local) 
repo for more details. 

## Run

In the `zkcloudworker-local` folder, run:
```
cd ~/zkcloudworker
cd zkcloudworker-local
yarn start encryption-example
```
