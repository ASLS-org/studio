# Installation

There are three ways to run ASLS Studio. Pick the one that fits you.

| Option | Best for | What you need |
|---|---|---|
| **In the browser** | Trying Studio, programming anywhere | A recent Chrome, Edge or Firefox. Open the <ResourceLink to="demo">live demo</ResourceLink> |
| **Desktop app** | Running shows on real lights | A build from the <ResourceLink to="releases">releases page</ResourceLink> for macOS, Windows or Linux, when one is attached |
| **From source** | Self-hosting the web version, contributing | Node.js and Git, steps below |

::: warning Beta software
Studio is in beta. Features are provided as-is, without guarantees. Please report problems on
the <ResourceLink to="issues">issue tracker</ResourceLink>.
:::

To drive real fixtures from the browser version, you also need the WSC gateway running on your
computer. See [How Studio works](/introduction/overview#from-studio-to-your-lights).

## System Requirements

### Hardware
- RAM: 4GB minimum (8GB or more recommended)
- Graphics: Integrated graphics with WebGL 1.0 / WebGL 2.0 support (Dedicated GPU recommended)

### Software
- Operating System: Any OS supporting the required software
- Node.js: 18 (for running from source)
- Browser: a recent version of Chrome, Edge or Firefox

## From source

1. **Clone the Repository**

   Open a terminal and navigate to your desired installation directory. Then run:

   ```
   git clone https://github.com/ASLS-org/studio.git
   ```

2. **Navigate to Project Directory**

   ```
   cd studio
   ```

3. **Install Dependencies**

   ```
   npm install
   ```

## Running ASLS Studio

### Local Development Server

To start ASLS Studio on a local development server:

1. Run the following command:

   ```
   npm start
   ```

2. Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

### Production Build

To create a production build:

1. Run the build command:

   ```
   npm run build
   ```

2. Locate the built files in the `./dist` folder at the project root.

## Troubleshooting

If you run into a problem during installation or use, please report it on the <ResourceLink to="issues">issue tracker</ResourceLink>.
