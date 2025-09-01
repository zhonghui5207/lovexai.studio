import { Button, Image, Announcement } from "@/types/blocks/base";

export interface Announcement {
  title?: string;
  description?: string;
  label?: string;
  url?: string;
  target?: string;
}

export interface PromptInput {
  placeholder?: string;
  generate_button?: string;
  example_text?: string;
}

export interface Hero {
  name?: string;
  disabled?: boolean;
  announcement?: Announcement;
  title?: string;
  highlight_text?: string;
  description?: string;
  buttons?: Button[];
  prompt_input?: PromptInput;
  image?: Image;
  tip?: string;
  show_happy_users?: boolean;
  show_badge?: boolean;
}
