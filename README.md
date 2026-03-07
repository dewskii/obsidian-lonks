## Lonks
> [!WARNING]
> Work in progress, proceed with caution
> (it'll probably be fine)

A plugin for Obsidian.md that automatically suggests and creates internal links as you type.
Supports note aliasing, case sensitivity, hopefully more in the future.

---

### Installation

As Lonks is not currently published, the easiest way to install is with the [BRAT](https://obsidian.md/plugins?id=obsidian42-brat) plugin.

Alternatively you can install manually by downloading the attached zip on the [most recent release](https://github.com/dewskii/obsidian-lonks/releases). Extract the zip file into your `.obsidian/plugins/` directory, and enable under community plugins.

### Settings

- **Trigger mode**: Automatic (suggestions while typing) or Manual (hotkey only)
- **Minimum match length**: Characters required before showing suggestions (default: 3)
- **Debounce delay**: Delay before checking for matches (default: 300ms)
- **Include aliases**: Match against frontmatter aliases
- **Case sensitive**: Require exact case matching
- **Excluded folders**: Folders to exclude from suggestions

### Commands

- **Rebuild note cache**: Force rebuild of the note index

---

### Development

If you wish to contribute, or build the plugin from source, the project is setup with a number of automations.

> [!NOTE]
> The project currently uses ultracite/biome for linting, which is incompatable with Obsidian's required linting rules. If this plugin is to be published, this will change to eslint.

```bash
# Install dependencies
❯ bun install

# Run the linter
❯ bun run lint 

# Fix linter issues
❯ bun run lint:fix

# Build (production)
❯ bun run build
```

#### Local Deploy to Vault

The `deploy` expects `DEPLOY_DIR` in the environment.
To take advantage update you'll need to set up your dotEnv file

Update `DEPLOY_DIR` in [env-example](env-example) to be the path to your vaults plugin directory, include `lonks` in the path, the deploy script will create it if it doesn't exist

```env
DEPLOY_DIR="Path/To/YourVault/.obsidian/plugins/lonks"
```

Rename `env-example` to `.env`
```bash
❯ mv env-example .env
```

Run the deploy command
```bash
❯ bun run deploy
```