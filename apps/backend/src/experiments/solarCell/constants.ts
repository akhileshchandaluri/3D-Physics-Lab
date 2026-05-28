export const SOLAR_CELL_EXPERIMENT_DATA = {
  slug: 'solar-cell-characteristics',
  title: 'Solar Cell Characteristics',
  overview:
    'The Solar Cell Characteristics experiment studies the relationship between voltage, current, and power output of a solar cell under varying light conditions and load resistance. The experiment helps analyze the electrical behavior and efficiency of photovoltaic devices.',
  aim:
    '• Study the V-I characteristics of a solar cell\n' +
    '• Analyze the effect of light intensity\n' +
    '• Determine output power characteristics\n' +
    '• Understand photovoltaic behavior',
  theory:
    'A solar cell converts light energy into electrical energy using the photovoltaic effect. When light falls on the semiconductor junction, electron-hole pairs are generated, producing electric current.\n\n' +
    'The output current and voltage depend on:\n' +
    '• Light intensity\n' +
    '• Temperature\n' +
    '• Load resistance\n\n' +
    'The V-I and P-V characteristic curves help determine the operating behavior and efficiency of the solar cell.',
  formula:
    'Current: I = V / R\n' +
    'Power: P = VI\n' +
    'Efficiency approximation: η ≈ Pout / Pin',
  conclusion:
    'The experiment verifies the electrical characteristics of a solar cell and demonstrates the relationship between voltage, current, and power under varying conditions. The V-I and P-V curves help analyze the efficiency and operating region of the photovoltaic system.',
};

export const SOLAR_MODEL_CONSTANTS = {
  vocBase: 0.62, // V at reference irradiance
  iscBase: 0.85, // A at reference irradiance
  panelAreaM2: 0.01, // educational approximation
  formFactor: 1.15, // shape control for IV curve
};
