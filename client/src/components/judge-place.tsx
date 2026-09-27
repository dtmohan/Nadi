import { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import type { GeoHit } from "@shared/schema";
import { PlaceSearch, placeLabel } from "@/components/place-search";
import { Button } from "@/components/ui/button";
import { useJudgePlace, setJudgePlace, locateDevice } from "@/lib/judge-place";
import { useToast } from "@/hooks/use-toast";

/**
 * Lets the astrologer say where they are judging from. The ruling planets are taken for that
 * place; the birth place is only the fallback.
 */
export function JudgePlaceControl({
  birthPlace,
  birthTimezone,
}: {
  birthPlace: string;
  birthTimezone: string;
}) {
  const judge = useJudgePlace();
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);

  const locate = async () => {
    setLocating(true);
    try {
      setJudgePlace(await locateDevice());
      setSearching(false);
    } catch (e: any) {
      toast({
        title: "Could not use the device location",
        description: e.message,
        variant: "destructive",
      });
      setSearching(true);
    } finally {
      setLocating(false);
    }
  };

  const pick = (h: GeoHit) => {
    setJudgePlace({
      label: placeLabel(h),
      latitude: h.latitude,
      longitude: h.longitude,
      timezone: h.timezone,
      source: "search",
    });
    setSearching(false);
  };

  return (
    <div
      className="mt-3 rounded-md border p-3 text-xs"
      data-testid="judge-place"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-muted-foreground">Judging from</span>
        <span className="font-medium" data-testid="text-judge-place">
          {judge ? judge.label : birthPlace}
          <span className="ml-1.5 font-normal text-muted-foreground">
            {judge
              ? judge.timezone
              : `${birthTimezone} · the birth place, until you set your own`}
          </span>
        </span>
        <span className="ml-auto inline-flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 px-2"
            onClick={locate}
            disabled={locating}
            data-testid="button-judge-locate"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" />
            )}
            Use my location
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => setSearching((v) => !v)}
            data-testid="button-judge-search"
          >
            {searching ? "Close search" : "Enter a place"}
          </Button>
          {judge && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground"
              onClick={() => setJudgePlace(null)}
              data-testid="button-judge-reset"
            >
              Birth place
            </Button>
          )}
        </span>
      </div>
      {searching && (
        <div className="mt-2 max-w-md">
          <PlaceSearch
            value=""
            onPick={pick}
            placeholder="Town where you are judging from"
            id="judge-place-input"
            testId="input-judge-place"
            inputClassName="h-8 text-xs"
          />
        </div>
      )}
      <p className="mt-2 text-muted-foreground">
        The rising sign and the day lord depend on where you sit, so KP takes
        the ruling planets for the astrologer's place at the moment of
        judgement, not the birth place (Astro Secrets &amp; KP Part 3, pp.
        161-162). Only the Moon's lords are the same everywhere. Your choice
        stays on this device and is used for the ruling planets and the
        rectification scan.
      </p>
    </div>
  );
}
