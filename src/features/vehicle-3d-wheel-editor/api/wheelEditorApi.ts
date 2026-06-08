import { authJson } from '../../../lib/api';

export type WheelModelOption = {
  id: string;
  name: string;
  url: string;
};

export type WheelEditConfig = {
  selectedWheelId: string;
  selectedWheelName: string;
  updatedAt: string;
};

export type WheelEditorModelResponse = {
  modelType: 'VEHICLE_LISTING' | 'PERSONAL';
  modelId: string;
  title?: string | null;
  modelUrl: string;
  wheelEdit: WheelEditConfig | null;
};

export const wheelEditorApi = {
  listWheels: () => authJson<WheelModelOption[]>('/3d-wheel-editor/wheels'),

  getVendorModel: (vehicleId: string) =>
    authJson<WheelEditorModelResponse>(
      `/3d-wheel-editor/vendor/vehicles/${vehicleId}`,
    ),

  saveVendorEdit: (vehicleId: string, selectedWheelId: string) =>
    authJson<WheelEditorModelResponse>(
      `/3d-wheel-editor/vendor/vehicles/${vehicleId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ selectedWheelId }),
      },
    ),

  getPersonalModel: (modelId: string) =>
    authJson<WheelEditorModelResponse>(
      `/3d-wheel-editor/personal/models/${modelId}`,
    ),

  savePersonalEdit: (modelId: string, selectedWheelId: string) =>
    authJson<WheelEditorModelResponse>(
      `/3d-wheel-editor/personal/models/${modelId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ selectedWheelId }),
      },
    ),
};
