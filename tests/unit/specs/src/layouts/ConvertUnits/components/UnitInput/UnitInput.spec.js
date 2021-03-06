import { shallowMount } from '@vue/test-utils';
import UnitInput from '@/layouts/ConvertUnits/components/UnitInput/UnitInput.vue';
import DropDownUnitSelector from '@/layouts/ConvertUnits/components/DropDownUnitSelector/DropDownUnitSelector.vue';

import { Tooling } from '@@/helpers';

describe('UnitInput.vue', () => {
  let localVue, i18n, wrapper, store;

  const options = ['Wei', 'Kwei', 'Mwei', 'Maher', 'Szabo'];
  beforeAll(() => {
    const baseSetup = Tooling.createLocalVueInstance();
    localVue = baseSetup.localVue;
    i18n = baseSetup.i18n;
    store = baseSetup.store;
  });

  beforeEach(() => {
    wrapper = shallowMount(UnitInput, {
      localVue,
      i18n,
      store,
      attachToDocument: true,
      propsData: { options },
      stubs: {
        'dropdown-unit-selector': DropDownUnitSelector
      }
    });
  });

  afterEach(() => {
    wrapper.destroy();
    wrapper = null;
  });

  it('should render correct valueLeft data', () => {
    expect(wrapper.vm.$el.querySelector('.block-left input').value).toEqual(
      String(wrapper.vm.$data.valueLeft)
    );
  });

  it('should render correct valueRight data', () => {
    expect(wrapper.vm.$el.querySelector('.block-right input').value).toEqual(
      String(wrapper.vm.$data.valueRight)
    );
  });
});
