import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Disclosure } from './disclosure';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from './tabs';
import { Switch } from './switch';
import { Menu, MenuButton, MenuItems, MenuItem } from './menu';
import { Popover, PopoverButton, PopoverPanel } from './popover';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from './listbox';

// ============================================================================
// Disclosure Tests
// ============================================================================
describe('Disclosure', () => {
  it('renders and toggles content', () => {
    render(
      <Disclosure>
        <Disclosure.Button>Toggle</Disclosure.Button>
        <Disclosure.Panel>Content</Disclosure.Panel>
      </Disclosure>
    );

    expect(screen.queryByText('Content')).toBeNull();
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('supports defaultOpen', () => {
    render(
      <Disclosure defaultOpen>
        <Disclosure.Button>Toggle</Disclosure.Button>
        <Disclosure.Panel>Content</Disclosure.Panel>
      </Disclosure>
    );
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('supports close on panel via close()', () => {
    function Test() {
      return (
        <Disclosure>
          <Disclosure.Button>Toggle</Disclosure.Button>
          <Disclosure.Panel>
            {({ close }) => <button onClick={close}>Close</button>}
          </Disclosure.Panel>
        </Disclosure>
      );
    }
    render(<Test />);
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByText('Close')).toBeDefined();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Close')).toBeNull();
  });

  it('supports as prop with Fragment', () => {
    const { container } = render(
      <Disclosure as="div" className="wrapper">
        <Disclosure.Button>Toggle</Disclosure.Button>
        <Disclosure.Panel>Content</Disclosure.Panel>
      </Disclosure>
    );
    expect(container.querySelector('.wrapper')).not.toBeNull();
  });

  it('uncontrolled by default (no open/onToggle)', () => {
    render(
      <Disclosure>
        <Disclosure.Button>Toggle</Disclosure.Button>
        <Disclosure.Panel>Content</Disclosure.Panel>
      </Disclosure>
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByText('Content')).toBeDefined();
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.queryByText('Content')).toBeNull();
  });
});

// ============================================================================
// Tabs Tests
// ============================================================================
describe('Tabs', () => {
  it('renders tabs and switches panels', () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab A</Tab>
          <Tab>Tab B</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel A</TabPanel>
          <TabPanel>Panel B</TabPanel>
        </TabPanels>
      </Tabs>
    );

    expect(screen.getByText('Panel A')).toBeDefined();
    expect(screen.queryByText('Panel B')).toBeNull();
    fireEvent.click(screen.getByText('Tab B'));
    expect(screen.getByText('Panel B')).toBeDefined();
  });

  it('supports controlled mode', () => {
    function Controlled() {
      const [index, setIndex] = React.useState(0);
      return (
        <div>
          <button onClick={() => setIndex(1)}>Go to B</button>
          <Tabs selectedIndex={index} onChange={setIndex}>
            <TabList>
              <Tab>Tab A</Tab>
              <Tab>Tab B</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>Panel A</TabPanel>
              <TabPanel>Panel B</TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      );
    }
    render(<Controlled />);
    expect(screen.getByText('Panel A')).toBeDefined();
    fireEvent.click(screen.getByText('Go to B'));
    expect(screen.getByText('Panel B')).toBeDefined();
  });

  it('supports vertical orientation', () => {
    render(
      <Tabs vertical>
        <TabList>
          <Tab>Tab A</Tab>
          <Tab>Tab B</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel A</TabPanel>
          <TabPanel>Panel B</TabPanel>
        </TabPanels>
      </Tabs>
    );
    // ArrowDown should not switch in vertical mode (ArrowRight does)
    fireEvent.keyDown(screen.getByText('Tab A'), { key: 'ArrowRight' });
    expect(screen.getByText('Panel B')).toBeDefined();
  });

  it('disabled tab cannot be activated', () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Tab A</Tab>
          <Tab disabled>Tab B</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel A</TabPanel>
          <TabPanel>Panel B</TabPanel>
        </TabPanels>
      </Tabs>
    );
    fireEvent.click(screen.getByText('Tab B'));
    expect(screen.getByText('Panel A')).toBeDefined();
  });
});

// ============================================================================
// Switch Tests
// ============================================================================
describe('Switch', () => {
  it('renders and toggles', () => {
    function Test() {
      const [enabled, setEnabled] = React.useState(false);
      return (
        <Switch checked={enabled} onChange={setEnabled}>
          Enable
        </Switch>
      );
    }
    render(<Test />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(switchEl);
    expect(switchEl.getAttribute('aria-checked')).toBe('true');
  });

  it('does not toggle when disabled', () => {
    function Test() {
      const [enabled, setEnabled] = React.useState(false);
      return (
        <Switch checked={enabled} onChange={setEnabled} disabled>
          Enable
        </Switch>
      );
    }
    render(<Test />);
    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);
    expect(switchEl.getAttribute('aria-checked')).toBe('false');
  });

  it('toggles with Space key', () => {
    function Test() {
      const [enabled, setEnabled] = React.useState(false);
      return (
        <Switch checked={enabled} onChange={setEnabled}>
          Enable
        </Switch>
      );
    }
    render(<Test />);
    const switchEl = screen.getByRole('switch');
    fireEvent.keyDown(switchEl, { key: ' ' });
    expect(switchEl.getAttribute('aria-checked')).toBe('true');
  });

  it('supports as prop', () => {
    const { container } = render(
      <Switch as="div" checked={false} onChange={() => {}}>
        Toggle
      </Switch>
    );
    expect(container.querySelector('div[role="switch"]')).not.toBeNull();
  });
});

// ============================================================================
// Menu Tests (headless select/menu pattern)
// ============================================================================
describe('Menu', () => {
  it('renders and opens/closes', () => {
    render(
      <Menu>
        <MenuButton>Options</MenuButton>
        <MenuItems>
          <MenuItem>Item 1</MenuItem>
          <MenuItem>Item 2</MenuItem>
        </MenuItems>
      </Menu>
    );

    expect(screen.queryByText('Item 1')).toBeNull();
    fireEvent.click(screen.getByText('Options'));
    expect(screen.getByText('Item 1')).toBeDefined();
  });

  it('closes on item click', () => {
    render(
      <Menu>
        <MenuButton>Options</MenuButton>
        <MenuItems>
          <MenuItem>Item 1</MenuItem>
        </MenuItems>
      </Menu>
    );
    fireEvent.click(screen.getByText('Options'));
    fireEvent.click(screen.getByText('Item 1'));
    expect(screen.queryByText('Item 1')).toBeNull();
  });

  it('closes on outside click', () => {
    render(
      <div>
        <Menu>
          <MenuButton>Options</MenuButton>
          <MenuItems>
            <MenuItem>Item 1</MenuItem>
          </MenuItems>
        </Menu>
        <button>Outside</button>
      </div>
    );
    fireEvent.click(screen.getByText('Options'));
    expect(screen.getByText('Item 1')).toBeDefined();
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByText('Item 1')).toBeNull();
  });

  it('closes on Escape', () => {
    render(
      <Menu>
        <MenuButton>Options</MenuButton>
        <MenuItems>
          <MenuItem>Item 1</MenuItem>
        </MenuItems>
      </Menu>
    );
    fireEvent.click(screen.getByText('Options'));
    fireEvent.keyDown(screen.getByText('Options'), { key: 'Escape' });
    expect(screen.queryByText('Item 1')).toBeNull();
  });
});

// ============================================================================
// Popover Tests
// ============================================================================
describe('Popover', () => {
  it('renders and toggles', () => {
    render(
      <Popover>
        <PopoverButton>Info</PopoverButton>
        <PopoverPanel>Details</PopoverPanel>
      </Popover>
    );

    expect(screen.queryByText('Details')).toBeNull();
    fireEvent.click(screen.getByText('Info'));
    expect(screen.getByText('Details')).toBeDefined();
  });

  it('closes on outside click', () => {
    render(
      <div>
        <Popover>
          <PopoverButton>Info</PopoverButton>
          <PopoverPanel>Details</PopoverPanel>
        </Popover>
        <button>Outside</button>
      </div>
    );
    fireEvent.click(screen.getByText('Info'));
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByText('Details')).toBeNull();
  });

  it('closes on Escape', () => {
    render(
      <Popover>
        <PopoverButton>Info</PopoverButton>
        <PopoverPanel>Details</PopoverPanel>
      </Popover>
    );
    fireEvent.click(screen.getByText('Info'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Details')).toBeNull();
  });

  it('supports focus management', () => {
    render(
      <Popover>
        <PopoverButton>Info</PopoverButton>
        <PopoverPanel focus>Details</PopoverPanel>
      </Popover>
    );
    fireEvent.click(screen.getByText('Info'));
    // Panel should be rendered
    expect(screen.getByText('Details')).toBeDefined();
  });
});

// ============================================================================
// Listbox Tests (headless select)
// ============================================================================
describe('Listbox', () => {
  const options = [
    { id: 1, name: 'Option A' },
    { id: 2, name: 'Option B' },
    { id: 3, name: 'Option C' },
  ];

  it('renders and opens/closes', () => {
    render(
      <Listbox value={null} onChange={() => {}}>
        <ListboxButton>Choose</ListboxButton>
        <ListboxOptions>
          {options.map((o) => (
            <ListboxOption key={o.id} value={o}>
              {o.name}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    );

    expect(screen.queryByText('Option A')).toBeNull();
    fireEvent.click(screen.getByText('Choose'));
    expect(screen.getByText('Option A')).toBeDefined();
  });

  it('selects an option', () => {
    function Test() {
      const [value, setValue] = React.useState<{ id: number; name: string } | null>(null);
      return (
        <div>
          <span data-testid="selected">{value?.name ?? 'none'}</span>
          <Listbox value={value} onChange={setValue}>
            <ListboxButton>Choose</ListboxButton>
            <ListboxOptions>
              {options.map((o) => (
                <ListboxOption key={o.id} value={o}>
                  {o.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>
      );
    }
    render(<Test />);
    fireEvent.click(screen.getByText('Choose'));
    fireEvent.click(screen.getByText('Option B'));
    expect(screen.getByTestId('selected').textContent).toBe('Option B');
  });

  it('shows selected state', () => {
    render(
      <Listbox value={options[1]} onChange={() => {}}>
        <ListboxButton>Choose</ListboxButton>
        <ListboxOptions>
          {options.map((o) => (
            <ListboxOption key={o.id} value={o}>
              {o.name}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    );
    fireEvent.click(screen.getByText('Choose'));
    const optionB = screen.getByText('Option B');
    expect(optionB.getAttribute('aria-selected')).toBe('true');
  });

  it('disabled option cannot be selected', () => {
    function Test() {
      const [value, setValue] = React.useState<{ id: number; name: string } | null>(null);
      return (
        <div>
          <span data-testid="selected">{value?.name ?? 'none'}</span>
          <Listbox value={value} onChange={setValue}>
            <ListboxButton>Choose</ListboxButton>
            <ListboxOptions>
              {options.map((o, i) => (
                <ListboxOption key={o.id} value={o} disabled={i === 1}>
                  {o.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>
      );
    }
    render(<Test />);
    fireEvent.click(screen.getByText('Choose'));
    fireEvent.click(screen.getByText('Option B'));
    expect(screen.getByTestId('selected').textContent).toBe('none');
  });

  it('closes on outside click', () => {
    render(
      <div>
        <Listbox value={null} onChange={() => {}}>
          <ListboxButton>Choose</ListboxButton>
          <ListboxOptions>
            {options.map((o) => (
              <ListboxOption key={o.id} value={o}>
                {o.name}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
        <button>Outside</button>
      </div>
    );
    fireEvent.click(screen.getByText('Choose'));
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByText('Option A')).toBeNull();
  });
});
