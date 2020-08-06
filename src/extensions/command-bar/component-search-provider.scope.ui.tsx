import React from 'react';
import Fuse from 'fuse.js';
import CommandBarUI, { SearchProvider } from './command-bar.ui';
import ScopeUI from '../scope/scope.ui';
import { ComponentModel } from '../component/ui';
import { ComponentID } from '../component';
import { ComponentItem } from './ui/component-item';
import { ReactRouterUI } from '../react-router/react-router.ui';
import { componentToUrl } from '../component/component-path.ui';

export default class ScopeComponentSearchProvider implements SearchProvider {
  static dependencies = [CommandBarUI, ScopeUI, ReactRouterUI];
  static slots = [];
  static async provider(
    [commandBarUI, scopeUi, reactRouterUI]: [CommandBarUI, ScopeUI, ReactRouterUI] /* config, slots: [] */
  ) {
    const commandSearcher = new ScopeComponentSearchProvider(scopeUi, reactRouterUI);
    commandBarUI.addSearcher(commandSearcher);
    return commandSearcher;
  }
  constructor(private scopeUi: ScopeUI, private reactRouterUI: ReactRouterUI) {}

  private fuseComponents = new Fuse<ComponentModel>([], {
    // weight can be included here.
    // fields loses weight the longer it gets, so it seems ok for now.
    keys: ['id.fullName'],
  });

  test(term: string): boolean {
    return !term.startsWith('>') && term.length > 0;
  }

  search = (pattern: string, limit: number) => {
    this.refreshComponents();

    const searchResults = this.fuseComponents.search(pattern, { limit });

    return searchResults.map((x) => (
      <ComponentItem key={x.item.id.toString()} component={x.item} execute={() => this.execute(x.item.id)} />
    ));
  };

  private execute = (componentId: ComponentID) => {
    const nextUrl = componentToUrl(componentId);
    this.reactRouterUI.push(nextUrl);
  };

  private _prevList?: ComponentModel[] = undefined;
  private refreshComponents() {
    const components = this.scopeUi.listComponents();
    if (!components) {
      this._prevList = undefined;
      return;
    }

    if (this._prevList === components) return;

    this.fuseComponents.setCollection(components);
    this._prevList = components;
  }
}