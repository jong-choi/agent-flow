"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const MAX_SUGGESTIONS = 8;

const normalizeTag = (value: string) => value.trim().replace(/\s+/g, " ");
const tagKey = (value: string) => normalizeTag(value).toLowerCase();

type PresetTagInputProps = {
  name?: string;
  id?: string;
  label?: string;
  description?: string;
  placeholder?: string;
};

export function PresetTagInput({
  name = "tags",
  id = "preset-tags",
  label,
  description,
  placeholder,
}: PresetTagInputProps) {
  const t = useTranslations<AppMessageKeys>("Presets");
  const resolvedLabel = label ?? t("tagInput.label");
  const resolvedDescription = description ?? t("tagInput.defaultDescription");
  const resolvedPlaceholder = placeholder ?? t("tagInput.placeholder");

  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedKeys = useMemo(
    () => new Set(tags.map((tag) => tagKey(tag))),
    [tags],
  );

  const fetchSuggestions = useCallback(async (value: string) => {
    const query = normalizeTag(value);
    if (!query) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/presets/tags?query=${encodeURIComponent(query)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("TAG_SEARCH_FAILED");
      }

      const payload = (await response.json()) as { tags?: string[] };
      const next = Array.isArray(payload.tags) ? payload.tags : [];
      setSuggestions(next.slice(0, MAX_SUGGESTIONS));
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce((value: string) => {
    void fetchSuggestions(value);
  }, 200);

  useEffect(() => {
    debouncedSearch(inputValue);
  }, [debouncedSearch, inputValue]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const addTag = useCallback(
    (value: string) => {
      const normalized = normalizeTag(value);
      if (!normalized) {
        return;
      }

      const key = tagKey(normalized);
      if (selectedKeys.has(key)) {
        setInputValue("");
        return;
      }

      setTags((prev) => [...prev, normalized]);
      setInputValue("");
      setSuggestions([]);
    },
    [selectedKeys],
  );

  const removeTag = useCallback((value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value));
  }, []);

  const visibleSuggestions = useMemo(
    () =>
      suggestions.filter(
        (tag) => !selectedKeys.has(tagKey(tag)) && tag.length > 0,
      ),
    [selectedKeys, suggestions],
  );

  const normalizedInput = normalizeTag(inputValue);
  const showCreateOption =
    normalizedInput.length > 0 &&
    !selectedKeys.has(tagKey(normalizedInput)) &&
    !visibleSuggestions.some((tag) => tagKey(tag) === tagKey(normalizedInput));

  const shouldShowList =
    isOpen && (isLoading || showCreateOption || visibleSuggestions.length > 0);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(inputValue);
      return;
    }

    if (event.key === "Backspace" && inputValue === "" && tags.length > 0) {
      event.preventDefault();
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {resolvedLabel}
        </label>
        {tags.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {t("tagInput.selectedCount", { count: tags.length })}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={resolvedPlaceholder}
          aria-expanded={shouldShowList}
          aria-controls={`${id}-suggestions`}
          autoComplete="off"
        />
        {shouldShowList ? (
          <div className="absolute top-full right-0 left-0 z-10 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md">
            <div
              id={`${id}-suggestions`}
              role="listbox"
              className="max-h-56 overflow-y-auto py-1 text-sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
                  <Spinner className="size-3" />
                  {t("tagInput.loading")}
                </div>
              ) : null}
              {showCreateOption ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(normalizedInput)}
                >
                  <PlusIcon className="size-3" />
                  <span>{t("tagInput.addOption", { tag: normalizedInput })}</span>
                </button>
              ) : null}
              {visibleSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(tag)}
                >
                  <span>{tag}</span>
                </button>
              ))}
              {!isLoading &&
              !showCreateOption &&
              visibleSuggestions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {t("tagInput.noResults")}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {resolvedDescription ? (
        <p className="text-xs text-muted-foreground">{resolvedDescription}</p>
      ) : null}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 transition hover:bg-muted"
              >
                <XIcon className="size-3" />
                <span className="sr-only">{t("tagInput.removeTagSrOnly")}</span>
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      {tags.map((tag) => (
        <input key={`${tag}-hidden`} type="hidden" name={name} value={tag} />
      ))}
    </div>
  );
}
