<div align="center">
<img src="https://passkeys-4337.vercel.app/favicon.ico" width="100"/>
<h1 align="center" style="margin-bottom: 0">ERC-4337 Smart Wallet controlled with Passkeys</h1>
<p align="center">An open source contribution to the Web3 community around account abstraction and improved user onboarding.</br>
Live demo app: <a href="https://passkeys-4337.vercel.app" target="_blank">passkeys-4337.vercel.app</a></p>
</div>

</br>

<div align="center">

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-red.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![CI](https://github.com/eugenPtr/smart-wallet/actions/workflows/ci.yml/badge.svg)](https://github.com/eugenPtr/smart-wallet/actions/workflows/ci.yml)
[![Sepolia Testnet](https://img.shields.io/badge/Sepolia%20testnet-blue?&label=deployed%20on)](https://passkeys-4337.vercel.app/)
[![ERC-4337](https://img.shields.io/badge/4337-teal?&label=ERC)](https://passkeys-4337.vercel.app/)
[![Passkeys](https://img.shields.io/badge/Passkeys-teal?&label=Auth)](https://w3c.github.io/webauthn/)</br>
[![Twitter Follow](https://img.shields.io/twitter/follow/BigQ?style=social)](https://twitter.com/big_q__)
[![Twitter Follow](https://img.shields.io/twitter/follow/ben.anoufa.eth?style=social)](https://twitter.com/Baoufa)

</div>

<div align="center">
  <a href="https://www.youtube.com/watch?v=Z2gfLdU8NAU" target="_blank" >
  <img src="https://i.imgur.com/ZaBW1Ci.png" width="600" />
  </a>
</div>

# Project Summary

Onboarding new users into blockchain applications is a challenge. Current solutions revolves around mnemonics that need to be stored to recover accounts on users wallets, effectively introducing security risks. By using passkeys to control accounts, we abstract away the need for users to store mnemonics and we allow users to use a familiar interface to control their accounts (biometric authentication) in one click UX.

Our wallet is meant to be an implementation of the [ERC-4337 standard](https://github.com/eth-infinitism/account-abstraction), that allow users to have an account in the form of a smart contract. In this case, we use passkeys to let users control their account thanks to the onchain P256 signature verification developed by [Daimo](https://github.com/daimo-eth/p256-verifier).

</br>

![image](https://i.imgur.com/yqsyRgn.png)



## Acknowledgments

We wanted to explore the possibilities of this two technologies, and how they can be used together to create a more user friendly experience, while ensuring security.

The wallet is designed to be simple, with minimal dependencies, only on Sepolia testnet. It is meant to be used as a user friendly proof of concept for the ERC-4337 standard, and to showcase the possibilities of passkeys. It is not meant to be used in any production network in this state. Hopefully, it will inspire other developers to create more user friendly applications that use passkeys/ERC-4337 and help new developers understand how to use these technologies in a codebase.

This project was meant possible thanks to the building blocks previously made by the following teams. Thank you to all of them for their work!

- [Daimo](https://github.com/daimo-eth) and their [p256-verifier](https://github.com/daimo-eth/p256-verifier) for the onchain signature verification
- [Infinitism](https://github.com/eth-infinitism/) and their work around [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)
- [Pimlico](https://www.pimlico.io/) and their work for the [Bundler and Paymaster infrastructure](https://docs.pimlico.io/)
- [Matthew Miller](https://twitter.com/iamkale) and his work around [WebAuthn](https://github.com/MasterKale/SimpleWebAuthn)
- [Webauthn.io](https://webauthn.guide/) for their great documentation around WebAuthn and their [demo](https://webauthn.io/)

## Why Passkeys?

Passkeys are a new way to authenticate users, that are more secure than passwords, and more user friendly than mnemonics. Our aim is to make blockchain applications more accessible to the general public, and we believe that passkeys are a great way to do so. Our UI strives in making it easy for users to create, retrieve existing accounts and sign transactions via Passkeys. As a user, all notion of passkeys are abstracted and you just need to remember a simple username to access your account.

## Mobile first?

While being built with NextJS for ease of development and education purposes, our wallet is designed to be easy to use on mobile. Grab your phone, proceed to a biometric authentication, and you can start using your account in a few seconds.

## Wallet Connect support?

We support Wallet Connect in a very minimal way. We only allow you to connect to your account and send transactions. We do not support signing messages or any other features. This is a proof of concept, and we wanted to keep it simple while educational about this other technology.

---

# How does it work?

## Passkey Generation

When you create an account, a passkey is generated and stored in your device or your password manager. This passkey is tied to an id. This is worth noting that the passkey is never managed by the wallet itself, the wallet only uses the browser API to interact with it. Basically, the wallet asks for signatures and your device/password manager handles the rest. This is a very important security feature, as it means that the wallet never has access to your passkey, and cannot be compromised to steal it.

## User creation

Once the passkey is generated, the passkeys browser API returns a public key and an id. These public information are stored onchain and used to identify your account.

## Smart Account creation

The Smart Account is the contract implementing the ERC-4337 standard. Its address is deterministically computed from the public key of the user. This contract implements all the logic to verify signatures, effectively allowing the user to operate onchain actions thanks to their passkey. The contract is not deployed when the passkey is generated to avoid paying huge gas fees for a contract that might never be used. Instead, it is deployed when the user first interacts with the contract.

</br>

![image](https://i.imgur.com/4PxmDaH.png)


## Onchain interactions via UserOperations

The ERC-4337 standard revolves around UserOperations, which are basically objects replacing transactions and that are sent on behalf of the user by nodes known as [`Bundlers`](https://docs.pimlico.io/permissionless/bundler). UserOperations are signed by the user with their passkey and the bundler's job is to include them in a block while taking a little fee for the work. In our case, we use the [Pimlico Bundler implementation](https://docs.pimlico.io/). We strongly advise you to look at Pimlico documentation and the ERC-4337 EIP to understand how Bundlers work.

## Retrieving an account

Retrieving an account, is simply done by using the browser API. The wallet will ask for a signature of a random message but the signature is not used. Instead, the browser API returns the id of the passkey. The wallet then uses these information to retrieve the account information onchain (the deterministic address of the Smart Account and the balance being the two main interesting information for the UI).

## How to use it? (on Sepolia testnet)

The wallet can be found at: https://passkeys-4337.vercel.app/
On your first visit, create an account by entering a username. You will be asked to authenticate with your device (biometric authentication for example). Once done, you will be redirected to your account page. You can then see your address, balance, send transactions to other accounts, or connect to other applications via Wallet Connect.

---

# Installation on your local environment

## Requirements

- [pnpm](https://pnpm.io/installation)
- [Pimlico API KEY](https://dashboard.pimlico.io/): to be able to include UserOperations in blocks, see [.env.local.example](./front/.env.local.example)
- a **TESTING** account with some Sepolia funds, to be able to sponsor user creation (see [.env.local.example](./front/.env.local.example)). Be careful to not use any private key tied to some real funds. **DO NOT LEAK YOUR PRIVATE KEYS**.
- [Foundry](https://book.getfoundry.sh/getting-started/installation): if you want to deploy your own contracts.

## Installation

The front is built with NextJS, and the contracts are built with Foundry. To install the dependencies, run:

```bash
cd front
pnpm install
```

Before running the front, you need to update the `.env.local` file with your own values. You can find an example in [.env.local.example](./front/.env.local.example).

```bash
cp .env.local.example .env.local
# Then update the values of the Pimlico API KEY and the TESTING private key
```

## Run

```bash
pnpm dev
```

## Deploy your own Smart Account Factory (optional)

```bash
forge script DeploySimpleAccountFactory --rpc-url $RPC_URL --private-key $PRIVATE_KEY  --etherscan-api-key $ETHERSCAN_API_KEY --verify --slow --broadcast
```

## Mobile Development (iOS/Android)

This project includes a mobile app built with Capacitor. Here's the workflow for updating the native iOS app after making Next.js code changes:

### Prerequisites
- Xcode (for iOS development)
- Android Studio (for Android development)
- Capacitor CLI installed (`@capacitor/cli` in devDependencies)
- ngrok (for iOS passkey development)

### Initial Capacitor Setup

If this is your first time setting up the project, you need to generate the native iOS and Android directories:

```bash
# Generate iOS directory and project files
npx cap add ios

# Generate Android directory and project files (optional)
npx cap add android

# Build your web app first
npm run build

# Sync web assets with native projects
npx cap sync
```

**Note**: The `ios` and `android` directories are typically ignored in version control, so you'll need to run these commands after cloning the repository.

### Setting up Passkeys for iOS Development with ngrok

**Important**: iOS requires HTTPS domains for passkey (WebAuthn) functionality. For local development, you must use ngrok to tunnel your development server.

#### 1. Install and Configure ngrok
```bash
# Install ngrok
brew install ngrok/ngrok/ngrok

# Sign up at https://ngrok.com and get your auth token
ngrok authtoken YOUR_AUTH_TOKEN
```

#### 2. Configure Your iOS App ID
The domain association server needs your specific iOS App ID. This consists of your Team ID + Bundle Identifier.

**Easiest Method - Let the App Tell You:**
1. Run your app in iOS Simulator without setting up the domain association
2. Try to create a passkey in the app
3. The error message will show your exact App ID in this format: `"Application with identifier TEAM_ID.BUNDLE_IDENTIFIER is not associated with domain"`
4. Copy the App ID from the error message

**Update your .env.local:**
```bash
# Add to .env.local - use the App ID from the error message or combine TEAM_ID.BUNDLE_IDENTIFIER
IOS_APP_ID=4G5YQ8G38R.io.coil.wallet
# Generate a domain on the ngrok dashboard
NEXT_PUBLIC_NGROK_DOMAIN=rosita-geoponic-dwain.ngrok-free.app
```

#### 3. Set up Domain Association
The iOS app needs to trust your ngrok domain. The domain association server will automatically serve the correct configuration using your App ID.

#### 4. Configure iOS Associated Domains
In Xcode, you need to add associated domains capability:

1. Open the iOS project: `npx cap open ios`
2. Select your app target
3. Go to "Signing & Capabilities" tab
4. Add "Associated Domains" capability
5. Add these domains:
   - `applinks:your-ngrok-domain`
   - `webcredentials:your-ngrok-domain`

#### 5. Development Workflow with ngrok

1. **Start the domain association server:**
   ```bash
   cd dev
   npm install
   npm start
   ```

2. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 8080 --domain=<YOUR_NGROK_DOMAIN>
   ```

3. **Build and sync Capacitor:**
   ```bash
   npm run build
   npx cap sync ios
   ```

4. **Open in Xcode and run:**
   ```bash
   npx cap run ios
   ```

#### 5. Testing Passkeys
- Passkeys will only work on device/simulator when accessed via the ngrok HTTPS URL
- The domain association files are served at:
  - `https://your.ngrok.domain/apple-app-site-association`

#### Troubleshooting
- **"Application not associated with domain"**: Verify associated domains are correctly set in Xcode
- **Passkey creation fails**: Ensure ngrok is running and domain matches exactly

### Development Workflow

#### For Next.js code changes:
```bash
# 1. Build Next.js app
npm run build

# 2. Sync with native platforms (copies web assets and updates config)
npx cap sync ios

# 3. Open and run in Xcode
npx cap run ios
```

#### For Capacitor config changes only:
```bash
# Sync configuration changes
npx cap sync ios

# Open in Xcode
npx cap open ios
```

#### For Android:
Replace `ios` with `android` in the commands above:
```bash
npm run build
npx cap sync android
npx cap run android
```

### Important Notes
- Always run `npm run build` before syncing if you changed Next.js code
- The `npx cap sync` command handles both configuration updates and web asset copying
- For significant config changes (like bundle ID), you may need to clean: `npx cap sync ios --deployment`
- **For passkeys**: Always use ngrok for iOS development and ensure domain association is properly configured
