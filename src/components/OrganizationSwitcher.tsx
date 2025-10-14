import { Check, ChevronsUpDown, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    currentOrganization,
    organizations,
    isPersonalContext,
    switchToPersonal,
    switchToOrganization,
  } = useOrganization();

  const currentLabel = isPersonalContext
    ? "Personal Account"
    : currentOrganization?.name || "Select organization";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an organization"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {isPersonalContext ? (
              <User className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-primary" />
            )}
            <span className="truncate">{currentLabel}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Personal">
              <CommandItem
                onSelect={() => {
                  switchToPersonal();
                  setOpen(false);
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Personal Account
                {isPersonalContext && <Check className="ml-auto h-4 w-4" />}
              </CommandItem>
            </CommandGroup>
            {organizations.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Organizations">
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.id}
                      onSelect={() => {
                        switchToOrganization(org.id);
                        setOpen(false);
                      }}
                    >
                      <div className="mr-2 h-4 w-4 rounded-full bg-primary" />
                      <span className="flex-1">{org.name}</span>
                      {currentOrganization?.id === org.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  navigate("/organizations/new");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}