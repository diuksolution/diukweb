// DIUK Brand Colors
export const colors = {
  blue: '#303d83',
  blueLight: '#4a5ba3',
  blueLighter: '#6b7bc3',
  teal: '#14b8a6',
  green: '#22c55e',
  lime: '#84cc16',
}

// Helper untuk gradient
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.blueLight} 25%, ${colors.teal} 50%, ${colors.green} 75%, ${colors.lime} 100%)`,
  text: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.teal} 50%, ${colors.lime} 100%)`,
  blueToLime: `linear-gradient(to right, ${colors.blue}, ${colors.lime})`,
  blueToTeal: `linear-gradient(to right, ${colors.blue}, ${colors.teal})`,
  blueTealLime: `linear-gradient(to right, ${colors.blue}, ${colors.teal}, ${colors.lime})`,
}

