<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
:root {
  /* === Colors - Cool Blue-White Palette === */
  --color-primary: #4A9EFF;
  --color-primary-light: #7DBAFF;
  --color-primary-dark: #2F7EE0;
  --color-primary-bg: rgba(74, 158, 255, 0.10);
  --color-primary-gradient: linear-gradient(135deg, #7DBAFF 0%, #4A9EFF 100%);
  --color-accent: #9B8AF0;
  --color-success: #34D399;
  --color-success-bg: rgba(52, 211, 153, 0.10);
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-danger-bg: rgba(239, 68, 68, 0.08);
  --color-white: #FFFFFF;
  --color-bg-page: #ECF1F9;
  --color-bg-card: rgba(255, 255, 255, 0.55);
  --color-bg-input: rgba(240, 244, 252, 0.65);
  --color-bg-hover: rgba(235, 241, 251, 0.70);
  --color-border-light: rgba(255, 255, 255, 0.50);
  --color-border: rgba(0, 0, 0, 0.06);
  --color-border-strong: rgba(0, 0, 0, 0.10);
  --color-text-primary: #121926;
  --color-text-secondary: #3D4A5C;
  --color-text-muted: #8B9AB5;
  --color-text-placeholder: #97A5BD;
  --color-text-inverse: #FFFFFF;
  --color-text-link: #4A9EFF;

  /* === GLASS: Background Opacity Levels === */
  --glass-bg-page: linear-gradient(175deg, #E4EBF7 0%, #EDF2FA 30%, #F2F6FB 60%, #F6F8FC 100%);
  --glass-bg-light: rgba(255, 255, 255, 0.38);
  --glass-bg-card: rgba(255, 255, 255, 0.48);
  --glass-bg-medium: rgba(248, 250, 255, 0.58);
  --glass-bg-strong: rgba(248, 250, 255, 0.72);
  --glass-bg-heavy: rgba(240, 244, 250, 0.82);
  --glass-bg-modal: rgba(240, 244, 252, 0.92);
  --glass-bg-tab: rgba(234, 240, 250, 0.84);

  /* === GLASS: Blur Levels === */
  --glass-blur-xs: blur(6px);
  --glass-blur-sm: blur(12px);
  --glass-blur-md: blur(20px);
  --glass-blur-lg: blur(28px);
  --glass-blur-xl: blur(36px);
  --glass-saturate: saturate(170%);

  /* === GLASS: Light Orbs === */
  --glass-light-orb-primary: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(74, 158, 255, 0.08) 0%, transparent 70%);
  --glass-light-orb-success: radial-gradient(ellipse 50% 40% at 50% 0%, rgba(52, 211, 153, 0.07) 0%, transparent 70%);
  --glass-light-orb-warm: radial-gradient(ellipse 55% 45% at 50% 0%, rgba(120, 160, 255, 0.06) 0%, transparent 70%);

  /* === Shadows - Layered Glass Stacks === */
  --shadow-glass-card:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.60),
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 2px 6px rgba(0, 0, 0, 0.03),
    0 6px 24px rgba(18, 52, 102, 0.05);
  --shadow-glass-card-raised:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.68),
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.04),
    0 10px 36px rgba(18, 52, 102, 0.07);
  --shadow-glass-modal:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 -4px 16px rgba(0, 0, 0, 0.05),
    0 -16px 52px rgba(18, 52, 102, 0.08);
  --shadow-glass-tab:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.70),
    0 0 0 1px rgba(0, 0, 0, 0.02),
    0 -2px 8px rgba(0, 0, 0, 0.03),
    0 -8px 28px rgba(18, 52, 102, 0.06);
  --shadow-glass-primary:
    0 0 0 0.5px rgba(74, 158, 255, 0.25),
    0 4px 14px rgba(74, 158, 255, 0.22),
    0 8px 30px rgba(74, 158, 255, 0.10);
  --shadow-glass-success:
    0 0 0 0.5px rgba(52, 211, 153, 0.25),
    0 4px 14px rgba(52, 211, 153, 0.22),
    0 8px 30px rgba(52, 211, 153, 0.10);

  /* Legacy shadow aliases */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 8px 30px rgba(18, 52, 102, 0.06);
  --shadow-primary: var(--shadow-glass-primary);
  --shadow-primary-sm: 0 4px 12px rgba(74, 158, 255, 0.20);
  --shadow-danger: 0 4px 12px rgba(239, 68, 68, 0.20);
  --shadow-success: 0 4px 12px rgba(52, 211, 153, 0.20);
  --shadow-top: 0 -2px 12px rgba(0, 0, 0, 0.04), 0 -8px 30px rgba(18, 52, 102, 0.05);

  /* === Radii - Generous & Organic === */
  --radius-xs: 5px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-2xl: 28px;
  --radius-full: 50%;

  /* === Spacing === */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;

  /* === Typography === */
  --font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-md: 15px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-590: 590;
  --letter-spacing-tight: -0.02em;
  --letter-spacing-numerals: -0.03em;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* === Transitions === */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === Z-Index === */
  --z-tab-bar: 100;
  --z-fab: 110;
  --z-modal: 1000;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

body {
  margin: 0; padding: 0;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--glass-bg-page);
  color: var(--color-text-primary);
}

@keyframes slideUpIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slideUpOut {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes tabFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dotBounce {
  0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-5px); }
}
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
@keyframes fabFloatIn {
  from { opacity: 0; transform: scale(0) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes fabPulse {
  0%, 100% { box-shadow: var(--shadow-primary); }
  50% { box-shadow: 0 8px 32px rgba(74, 158, 255, 0.40); }
}
@keyframes fabPulseGreen {
  0%, 100% { box-shadow: 0 6px 20px rgba(52, 211, 153, 0.30); }
  50% { box-shadow: 0 8px 32px rgba(52, 211, 153, 0.45); }
}
@keyframes glow-breathe {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}
@keyframes glass-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.slide-up-enter-active { animation: slideUpIn var(--transition-slow); }
.slide-up-leave-active { animation: slideUpOut var(--transition-normal); }
.fade-enter-active { animation: fadeIn var(--transition-normal); }
.fade-leave-active { animation: fadeOut var(--transition-normal); }
.tab-enter-active { animation: tabFadeIn var(--transition-normal); }
.tab-leave-active { animation: fadeOut 0.15s ease; }
</style>
