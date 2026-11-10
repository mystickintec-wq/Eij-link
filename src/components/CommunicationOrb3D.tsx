import React from 'react';
import { UXParticleDisplayer, UXParticleDisplayerProps, ParticleMode } from './UXParticleDisplayer';

export type CommunicationOrb3DProps = UXParticleDisplayerProps;
export type { ParticleMode };

/**
 * CommunicationOrb3D (UX Particle Displayer)
 * Re-exports the full interactive UX Particle Displayer with 3D Spherical Equalizer,
 * Neural Constellation, Acoustic Wave modes, and live Web Audio API microphone reactivity.
 */
export const CommunicationOrb3D: React.FC<CommunicationOrb3DProps> = (props) => {
  return <UXParticleDisplayer {...props} />;
};

export default CommunicationOrb3D;
