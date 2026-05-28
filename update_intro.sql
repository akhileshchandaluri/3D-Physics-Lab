SET NAMES utf8mb4;

UPDATE physim.experiments
SET
  aim = 'To study the relationship between voltage (V), current (I), and resistance (R) in a simple electrical circuit, and to verify Ohm''s Law experimentally by observing how current changes with varying voltage at constant resistance, and how resistance affects current flow at constant voltage.',

  theory = 'Ohm''s Law is one of the most fundamental principles in electrical engineering and physics. It was formulated by the German physicist Georg Simon Ohm in 1827. The law states that the current flowing through a conductor between two points is directly proportional to the voltage across the two points, provided the temperature and other physical conditions remain constant.

Mathematically, this is expressed as:
    V = I x R

Where V is the voltage in volts (V), I is the current in amperes (A), and R is the resistance in ohms (Ohm).

This linear relationship holds true for ohmic conductors such as metal wires and fixed resistors under constant temperature. When voltage increases, the current increases proportionally; when resistance increases, the current decreases proportionally.

In real conductors, resistance is not entirely constant — it varies with temperature. The temperature coefficient of resistance (alpha) describes how resistance changes with temperature:
    R(T) = R0 x (1 + alpha x DeltaT)

Where R0 is the resistance at the reference temperature (usually 25 degrees C), alpha is the temperature coefficient of resistance (for copper, alpha is approximately 0.00393 per degree C), and DeltaT is the change in temperature from the reference.

The I-V (current vs. voltage) characteristic graph for an ohmic conductor is a straight line passing through the origin, whose slope equals 1/R. Non-ohmic conductors such as diodes and light bulbs produce non-linear I-V curves.',

  formula = 'Ohm''s Law:
    V = I x R
    (Voltage = Current x Resistance)

Current Formula:
    I = V / R
    (Current = Voltage divided by Resistance)

Resistance Formula:
    R = V / I
    (Resistance = Voltage divided by Current)

Power Formulas:
    P = V x I           (Power = Voltage x Current)
    P = I^2 x R         (Power = Current squared x Resistance)
    P = V^2 / R         (Power = Voltage squared divided by Resistance)

Temperature-Dependent Resistance:
    R(T) = R0 x (1 + alpha x DeltaT)
    Where:
      R(T)   = Resistance at temperature T
      R0     = Resistance at reference temperature (25 degrees C)
      alpha  = Temperature coefficient of resistance
      DeltaT = T - T0 (change in temperature)

SI Units:
    Voltage (V)        — Volts (V)
    Current (I)        — Amperes (A) or milliamperes (mA)
    Resistance (R)     — Ohms (Ohm)
    Power (P)          — Watts (W)',

  conclusion = 'Through this virtual experiment, we have successfully verified Ohm''s Law by observing the direct proportionality between voltage and current in a resistive circuit at constant temperature. The I-V characteristic graph confirmed a linear relationship, validating the theoretical prediction.

Key observations from the simulation:
  1. When voltage was increased while resistance remained constant, the current increased proportionally, confirming I = V / R.
  2. When resistance was increased while voltage remained constant, the current decreased, confirming that R and I are inversely proportional.
  3. The slope of the I-V graph corresponded to 1/R, providing a graphical method to determine resistance.
  4. At elevated temperatures, the effective resistance increased due to the temperature coefficient, causing a slight reduction in current — demonstrating that Ohm''s Law strictly applies only under constant temperature conditions.

This experiment reinforces the understanding of Ohm''s Law as a cornerstone of circuit analysis and its practical relevance in designing electrical and electronic systems. It highlights the importance of controlling variables such as temperature when making precise electrical measurements in real-world laboratory settings.'

WHERE slug = 'ohms-law';
