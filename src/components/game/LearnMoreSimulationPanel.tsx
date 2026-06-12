import { useGameStore } from '@/store/gameStore'
import { AppButton, Panel, SectionLabel } from '@/components/ui/primitives'

export function LearnMoreSimulationPanel() {
  const openSimulationLab = useGameStore(s => s.openSimulationLab)

  return (
    <Panel className="learn-more-simulation-panel p-5 md:p-6">
      <div className="learn-more-simulation-layout">
        <div className="min-w-0">
          <SectionLabel>Learn more</SectionLabel>
          <h2>Simulate server concurrency</h2>
          <p className="tt-copy mt-2 max-w-3xl">
            Explore how service demand, expected arrivals, and worker count change queueing behavior in a local browser simulation.
          </p>
        </div>

        <AppButton
          type="button"
          className="learn-more-simulation-button"
          onClick={openSimulationLab}
        >
          Simulation
        </AppButton>
      </div>
    </Panel>
  )
}
