import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { Button } from "@ybdownload/ui/button";
import { Input } from "@ybdownload/ui/input";
import { Label } from "@ybdownload/ui/label";
import { RadioGroup, RadioGroupItem } from "@ybdownload/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ybdownload/ui/select";
import { Switch } from "@ybdownload/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@ybdownload/ui/tabs";

describe("@ybdownload/ui interactive cursor affordance", () => {
  it("uses cursor-pointer on primary interactive primitives", () => {
    render(
      <>
        <Button type="button">Save</Button>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
        </Tabs>
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" aria-label="Option A" />
        </RadioGroup>
        <Label htmlFor="name">Name</Label>
        <Switch aria-label="Enable feature" />
        <Select>
          <SelectTrigger aria-label="Format">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp3">MP3</SelectItem>
          </SelectContent>
        </Select>
      </>
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "cursor-pointer"
    );
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass(
      "cursor-pointer"
    );
    expect(screen.getByRole("radio", { name: "Option A" })).toHaveClass(
      "cursor-pointer"
    );
    expect(screen.getByText("Name")).toHaveClass("cursor-pointer");
    expect(screen.getByRole("switch", { name: "Enable feature" })).toHaveClass(
      "cursor-pointer"
    );
    expect(screen.getByRole("combobox", { name: "Format" })).toHaveClass(
      "cursor-pointer"
    );
  });

  it("does not use cursor-pointer on text inputs", () => {
    render(<Input aria-label="URL" />);

    expect(screen.getByRole("textbox", { name: "URL" })).not.toHaveClass(
      "cursor-pointer"
    );
  });
});
