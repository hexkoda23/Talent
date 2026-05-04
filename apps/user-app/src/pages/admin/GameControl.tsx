import { useMemo, useState } from "react";
import { Brain, Clock, RotateCcw, Save, Settings2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  defaultGameSettings,
  formatGameTime,
  GameDifficulty,
  GameSettings,
  getGameSettings,
  resetCompletedAttempts,
  saveGameSettings,
} from "@/lib/gameSettings";

const difficultyCopy: Record<GameDifficulty, string> = {
  standard: "Shows more Zzle hints, slower memory flashes, and forgiving penalties.",
  hard: "Shows fewer Zzle hints, faster memory flashes, and stronger penalties.",
  boss: "No Zzle path preview, fastest memory flashes, one memory mistake allowed.",
};

const GameControl = () => {
  const [settings, setSettings] = useState<GameSettings>(() => getGameSettings());
  const [saved, setSaved] = useState(false);

  const preview = useMemo(() => {
    return [
      { label: "Memory timer", value: formatGameTime(settings.memorySeconds) },
      { label: "Zzle timer", value: formatGameTime(settings.zzleSeconds) },
      { label: "Difficulty", value: settings.difficulty.toUpperCase() },
      { label: "Cut off", value: "70%" },
    ];
  }, [settings]);

  const update = (patch: Partial<GameSettings>) => {
    setSaved(false);
    setSettings((current) => ({ ...current, ...patch }));
  };

  const save = () => {
    saveGameSettings(settings);
    setSaved(true);
  };

  const reset = () => {
    setSettings(defaultGameSettings);
    saveGameSettings(defaultGameSettings);
    resetCompletedAttempts();
    setSaved(true);
  };

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-primary mb-2">// game administration</p>
          <h1 className="text-3xl lg:text-4xl">Game Difficulty Control</h1>
          <p className="text-muted-foreground max-w-2xl mt-3">
            Control the Memory and Zzle demo timing from here. Changes are saved locally and used the next time an applicant opens the game.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button variant="hero" onClick={save} className="gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,0.8fr] gap-5">
        <section className="glass-panel p-5 space-y-6">
          <ControlBlock icon={Target} title="Difficulty">
            <div className="grid sm:grid-cols-3 gap-3">
              {(["standard", "hard", "boss"] as GameDifficulty[]).map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => update({ difficulty })}
                  className={`border p-4 text-left transition-colors ${settings.difficulty === difficulty ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 hover:border-primary/50"}`}
                >
                  <p className="uppercase">{difficulty}</p>
                  <p className="text-xs text-muted-foreground mt-3 leading-5">{difficultyCopy[difficulty]}</p>
                </button>
              ))}
            </div>
          </ControlBlock>

          <ControlBlock icon={Brain} title="Memory timing">
            <NumberControl
              label="Seconds"
              min={20}
              max={180}
              value={settings.memorySeconds}
              onChange={(value) => update({ memorySeconds: value })}
            />
          </ControlBlock>

          <ControlBlock icon={Clock} title="Zzle timing">
            <NumberControl
              label="Seconds"
              min={45}
              max={300}
              value={settings.zzleSeconds}
              onChange={(value) => update({ zzleSeconds: value })}
            />
          </ControlBlock>
        </section>

        <aside className="glass-panel p-5 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl">Active game setup</h2>
          </div>
          <div className="space-y-3">
            {preview.map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-border pb-3 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border border-warning/40 bg-warning/10 p-4 text-sm text-muted-foreground">
            Boss mode is intentionally strict for the presentation: Zzle hides the path preview and Memory allows only one mistake.
          </div>
          {saved && <p className="mt-4 text-sm text-primary">Saved. New players will use this setup.</p>}
        </aside>
      </div>
    </div>
  );
};

const ControlBlock = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-xl">{title}</h2>
    </div>
    {children}
  </div>
);

const NumberControl = ({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (value: number) => void }) => (
  <div className="grid sm:grid-cols-[1fr,120px] gap-3 items-center">
    <label className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </label>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))}
      className="h-11 border border-border bg-muted px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    />
  </div>
);

export default GameControl;
