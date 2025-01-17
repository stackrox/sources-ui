import React from 'react';
import { Table, TableHeader, TableBody, RowWrapper, sortable, ActionsColumn, wrappable } from '@patternfly/react-table';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import ArrowsAltVIcon from '@patternfly/react-icons/dist/js/icons/arrows-alt-v-icon';
import LongArrowAltDownIcon from '@patternfly/react-icons/dist/js/icons/long-arrow-alt-down-icon';

import { DropdownItem } from '@patternfly/react-core';

import SourcesTable, { actionResolver, itemToCells, prepareColumnsCells } from '../../../components/SourcesTable/SourcesTable';
import { PlaceHolderTable, RowWrapperLoader, Loader } from '../../../components/SourcesTable/loaders';
import EmptyStateTable from '../../../components/SourcesTable/EmptyStateTable';

import { sourcesDataGraphQl } from '../../__mocks__/sourcesData';
import { sourceTypesData } from '../../__mocks__/sourceTypesData';
import { applicationTypesData } from '../../__mocks__/applicationTypesData';

import { componentWrapperIntl } from '../../../utilities/testsHelpers';
import * as actions from '../../../redux/sources/actions';
import * as API from '../../../api/entities';
import { replaceRouteId, routes } from '../../../Routes';
import { defaultSourcesState } from '../../../redux/sources/reducer';
import { sourcesColumns } from '../../../views/sourcesViewDefinition';
import mockStore from '../../__mocks__/mockStore';

describe('SourcesTable', () => {
  let loadedProps;
  let initialProps;
  let initialState;

  beforeEach(() => {
    initialProps = {};
    initialState = {
      sources: defaultSourcesState,
      user: {
        writePermissions: true,
      },
    };
    loadedProps = {
      loaded: 0,
      appTypesLoaded: true,
      sourceTypesLoaded: true,
      entities: sourcesDataGraphQl,
      numberOfEntities: sourcesDataGraphQl.length,
      appTypes: applicationTypesData.data,
      sourceTypes: sourceTypesData.data,
    };
    API.doLoadEntities = jest.fn().mockImplementation(() =>
      Promise.resolve({
        sources: sourcesDataGraphQl,
        sources_aggregate: { aggregate: { total_count: sourcesDataGraphQl.length } },
      })
    );
  });

  it('renders loading state', () => {
    const store = mockStore(initialState);
    const wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));

    expect(wrapper.find(PlaceHolderTable)).toHaveLength(1);
    expect(wrapper.find(ArrowsAltVIcon)).toHaveLength(0);
    expect(wrapper.find(LongArrowAltDownIcon)).toHaveLength(0);
  });

  it('renders removing row', async () => {
    initialState = {
      ...initialState,
      sources: {
        ...initialState.sources,
        ...loadedProps,
        removingSources: [sourcesDataGraphQl[0].id],
      },
    };

    const store = mockStore(initialState);
    let wrapper;
    await act(async () => {
      wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
    });
    wrapper.update();

    expect(wrapper.find(RowWrapperLoader)).toHaveLength(sourcesDataGraphQl.length);
    expect(wrapper.find(Loader)).toHaveLength(1);
  });

  it('renders table when loaded', async () => {
    const ROW_WRAPPER_CLASSNAME = 'src-c-row-vertical-centered';
    initialState = {
      ...initialState,
      sources: {
        ...initialState.sources,
        ...loadedProps,
      },
    };

    const store = mockStore(initialState);

    let wrapper;
    await act(async () => {
      wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
    });
    wrapper.update();

    const activeSortingIcon = 1;
    const expectSortableColumns =
      sourcesColumns({ formatMessage: () => {} }).filter((x) => x.sortable).length - activeSortingIcon;

    expect(wrapper.find(PlaceHolderTable)).toHaveLength(0);
    expect(wrapper.find(Table)).toHaveLength(1);
    expect(wrapper.find(TableHeader)).toHaveLength(1);
    expect(wrapper.find(TableBody)).toHaveLength(1);
    expect(wrapper.find(RowWrapper)).toHaveLength(sourcesDataGraphQl.length);
    expect(wrapper.find(ActionsColumn)).toHaveLength(sourcesDataGraphQl.length);
    expect(wrapper.find(RowWrapper).first().props().className).toEqual(ROW_WRAPPER_CLASSNAME);
    expect(wrapper.find(LongArrowAltDownIcon)).toHaveLength(1);
    expect(wrapper.find(ArrowsAltVIcon)).toHaveLength(expectSortableColumns);
  });

  it('renders table when loaded and its not org admin - no action column', async () => {
    const ROW_WRAPPER_CLASSNAME = 'src-c-row-vertical-centered';
    initialState = {
      user: {
        writePermissions: false,
      },
      sources: {
        ...initialState.sources,
        ...loadedProps,
      },
    };

    const store = mockStore(initialState);
    let wrapper;

    await act(async () => {
      wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
    });
    wrapper.update();

    expect(wrapper.find(PlaceHolderTable)).toHaveLength(0);
    expect(wrapper.find(Table)).toHaveLength(1);
    expect(wrapper.find(TableHeader)).toHaveLength(1);
    expect(wrapper.find(TableBody)).toHaveLength(1);
    expect(wrapper.find(RowWrapper)).toHaveLength(sourcesDataGraphQl.length);
    expect(wrapper.find(ActionsColumn)).toHaveLength(sourcesDataGraphQl.length);

    wrapper
      .find(ActionsColumn)
      .forEach((actions) => {
        actions.find(DropdownItem).forEach((item) => {
          expect(item.props().isDisabled).toEqual(true);
          expect(item.props().tooltip).toEqual(expect.any(String));
        });
      })
      .find(DropdownItem);
    expect(wrapper.find(RowWrapper).first().props().className).toEqual(ROW_WRAPPER_CLASSNAME);
  });

  it('renders empty state table', async () => {
    initialState = {
      ...initialState,
      sources: {
        ...initialState.sources,
        ...loadedProps,
        entities: [],
        numberOfEntities: 0,
        filterValue: {
          name: 'not-existing-name',
        },
      },
    };

    const store = mockStore(initialState);
    let wrapper;

    await act(async () => {
      wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
    });
    wrapper.update();

    expect(wrapper.find(EmptyStateTable)).toHaveLength(1);
    expect(wrapper.find(Table)).toHaveLength(1);
    expect(wrapper.find(TableHeader)).toHaveLength(1);
    expect(wrapper.find(TableBody)).toHaveLength(1);
    expect(wrapper.find(ActionsColumn)).toHaveLength(0);
    expect(wrapper.find(ArrowsAltVIcon)).toHaveLength(0);
  });

  it('re-renders when entities changed', async () => {
    let wrapper;

    initialState = {
      ...initialState,
      sources: {
        ...initialState.sources,
        ...loadedProps,
      },
    };

    const initialStateUpdated = {
      ...initialState,
      sources: {
        ...initialState.sources,
        entities: [sourcesDataGraphQl[0]],
        numberOfEntities: 1,
      },
    };

    let mockStoreFn = jest.fn().mockImplementation(() => initialState);
    const store = mockStore(mockStoreFn);

    await act(async () => {
      wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
    });
    wrapper.update();

    expect(wrapper.find(RowWrapper)).toHaveLength(sourcesDataGraphQl.length);

    mockStoreFn.mockImplementation(() => initialStateUpdated);

    // trigger render
    await act(async () => {
      wrapper.find('button').first().simulate('click');
    });

    wrapper.update();

    expect(wrapper.find(RowWrapper)).toHaveLength(1);
  });

  describe('actions', () => {
    const PAUSE_SOURCE_INDEX = 0;
    const DELETE_SOURCE_INDEX = 1;
    const EDIT_SOURCE_INDEX = 2;
    let wrapper;
    let store;

    beforeEach(async () => {
      initialState = {
        ...initialState,
        sources: {
          ...initialState.sources,
          ...loadedProps,
        },
      };

      store = mockStore(initialState);

      await act(async () => {
        wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
      });
      wrapper.update();
    });

    it('redirect to edit', async () => {
      await act(async () => {
        wrapper.find('.pf-c-dropdown__toggle').first().simulate('click');
      });
      wrapper.update();

      await act(async () => {
        wrapper.find('.pf-c-dropdown__menu-item').at(EDIT_SOURCE_INDEX).simulate('click');
      });
      wrapper.update();

      const expectedPath = replaceRouteId(routes.sourcesDetail.path, sourcesDataGraphQl[0].id);
      expect(wrapper.find(MemoryRouter).instance().history.location.pathname).toEqual(expectedPath);
    });

    it('redirect to delete', async () => {
      await act(async () => {
        wrapper.find('.pf-c-dropdown__toggle').first().simulate('click');
      });

      wrapper.update();

      await act(async () => {
        wrapper.find('.pf-c-dropdown__menu-item').at(DELETE_SOURCE_INDEX).simulate('click');
      });
      wrapper.update();

      const expectedPath = replaceRouteId(routes.sourcesRemove.path, sourcesDataGraphQl[0].id);
      expect(wrapper.find(MemoryRouter).instance().history.location.pathname).toEqual(expectedPath);
    });

    it('pause source', async () => {
      await act(async () => {
        wrapper.find('.pf-c-dropdown__toggle').first().simulate('click');
      });

      wrapper.update();

      actions.pauseSource = jest.fn().mockImplementation(() => ({ type: 'undefined-pause' }));

      await act(async () => {
        wrapper.find('.pf-c-dropdown__menu-item').at(PAUSE_SOURCE_INDEX).simulate('click');
      });
      wrapper.update();

      expect(actions.pauseSource).toHaveBeenCalledWith(sourcesDataGraphQl[0].id, sourcesDataGraphQl[0].name, expect.any(Object));

      const calledActions = store.getActions();
      expect(calledActions[calledActions.length - 1]).toEqual({ type: 'undefined-pause' });
    });
  });

  it('unpausing', async () => {
    const UNPAUSE_SOURCE_INDEX = 0;
    let wrapper;

    initialState = {
      ...initialState,
      sources: {
        ...initialState.sources,
        ...loadedProps,
        entities: [
          {
            ...sourcesDataGraphQl[0],
            paused_at: '123',
          },
        ],
      },
    };

    const store = mockStore(initialState);

    await act(async () => {
      wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
    });
    wrapper.update();

    await act(async () => {
      wrapper.find('.pf-c-dropdown__toggle').first().simulate('click');
    });
    wrapper.update();

    actions.resumeSource = jest.fn().mockImplementation(() => ({ type: 'undefined-resume' }));

    await act(async () => {
      wrapper.find('.pf-c-dropdown__menu-item').at(UNPAUSE_SOURCE_INDEX).simulate('click');
    });
    wrapper.update();

    expect(actions.resumeSource).toHaveBeenCalledWith(sourcesDataGraphQl[0].id, sourcesDataGraphQl[0].name, expect.any(Object));

    const calledActions = store.getActions();
    expect(calledActions[calledActions.length - 1]).toEqual({ type: 'undefined-resume' });
  });

  it('calls sortEntities', async () => {
    const spy = jest.spyOn(actions, 'sortEntities');

    initialState = {
      ...initialState,
      sources: {
        ...initialState.sources,
        ...loadedProps,
      },
    };

    const store = mockStore(initialState);

    let wrapper;
    await act(async () => {
      wrapper = mount(componentWrapperIntl(<SourcesTable {...initialProps} />, store));
    });
    wrapper.update();

    await act(async () => {
      wrapper.find('button').first().simulate('click');
    });
    wrapper.update();
    expect(spy).toHaveBeenCalledWith('name', 'asc');

    await act(async () => {
      wrapper.find('button').at(1).simulate('click');
    });
    expect(spy).toHaveBeenCalledWith('source_type_id', 'asc');
  });

  describe('helper functions', () => {
    const INTL_MOCK = { formatMessage: ({ defaultMessage }) => defaultMessage };
    const pushMock = jest.fn();

    describe('prepareColumnsCells', () => {
      it('prepares columns cells', () => {
        const columns = [
          {
            title: 'name',
            value: 'name',
            searchable: true,
            formatter: 'nameFormatter',
            sortable: false,
          },
          {
            title: 'date',
            value: 'date',
            nonsense: true,
            sortable: true,
          },
        ];

        expect(prepareColumnsCells(columns)).toEqual([
          {
            title: 'name',
            value: 'name',
            transforms: [wrappable],
          },
          {
            title: 'date',
            value: 'date',
            transforms: [sortable, wrappable],
          },
        ]);
      });
    });

    describe('itemToCells', () => {
      it('no formatter and no value', () => {
        const appTypes = [];
        const sourceTypes = [];

        let item = { name: 'some-name' };
        let columns = [
          { title: 'Column 1', value: 'name' },
          { title: 'Column 2', value: 'missing-attribute' },
        ];

        expect(itemToCells(item, columns, sourceTypes, appTypes)).toEqual([{ title: 'some-name' }, { title: '' }]);
      });
    });

    describe('actionResolver', () => {
      const actionObject = (title) =>
        expect.objectContaining({
          title: title ? expect.stringContaining(title) : expect.any(String),
        });

      const EDIT_TITLE = 'Edit';
      const VIEW_TITLE = 'View details';
      const DELETE_TITLE = 'Remove';
      const PAUSE_TITLE = 'Pause';
      const UNPAUSE_TITLE = 'Resume';

      it('create actions for editable source', () => {
        const EDITABLE_DATA = { imported: undefined };

        const actions = actionResolver(INTL_MOCK, pushMock)(EDITABLE_DATA);

        expect(actions).toEqual([actionObject(PAUSE_TITLE), actionObject(DELETE_TITLE), actionObject(EDIT_TITLE)]);
      });

      it('create actions for paused source', () => {
        const EDITABLE_DATA = { imported: undefined, paused_at: 'today' };

        const actions = actionResolver(INTL_MOCK, pushMock)(EDITABLE_DATA);

        expect(actions).toEqual([actionObject(UNPAUSE_TITLE), actionObject(DELETE_TITLE), actionObject(VIEW_TITLE)]);
      });
    });
  });
});
