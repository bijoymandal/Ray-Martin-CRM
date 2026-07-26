const API_URL = '/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiry / unauthorized requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isLoginRequest = requestUrl.includes('/auth/login');

      // Don't redirect when the login call itself fails — let the error
      // propagate back to the login form so we can show "Invalid credentials".
      if (!isLoginRequest) {
        localStorage.removeItem('crm_token');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const loginAPI = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerAPI = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const getMeAPI = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const verifyPasswordAPI = async (password) => {
  const response = await api.post('/auth/verify-password', { password });
  return response.data;
};

// Contacts Services
export const getContactsAPI = async (page = 1, limit = 10) => {
  const response = await api.get('/contacts', { params: { page, limit } });
  return response.data;
};

export const getContactByIdAPI = async (id) => {
  const response = await api.get(`/contacts/${id}`);
  return response.data;
};

export const createContactAPI = async (contactData) => {
  const response = await api.post('/contacts', contactData);
  return response.data;
};

export const updateContactAPI = async (id, contactData) => {
  const response = await api.put(`/contacts/${id}`, contactData);
  return response.data;
};

export const deleteContactAPI = async (id) => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};

// Deals Services
export const getDealsAPI = async (page = 1, limit = 10) => {
  const response = await api.get('/deals', { params: { page, limit } });
  return response.data;
};

export const getDealByIdAPI = async (id) => {
  const response = await api.get(`/deals/${id}`);
  return response.data;
};

export const createDealAPI = async (dealData) => {
  const response = await api.post('/deals', dealData);
  return response.data;
};

export const updateDealAPI = async (id, dealData) => {
  const response = await api.put(`/deals/${id}`, dealData);
  return response.data;
};

export const deleteDealAPI = async (id) => {
  const response = await api.delete(`/deals/${id}`);
  return response.data;
};

// User Management Services (Admin Only)
export const getUsersAPI = async (page = 1, limit = 10) => {
  const response = await api.get('/users', { params: { page, limit } });
  return response.data;
};

export const updateUserRoleAPI = async (id, role) => {
  const response = await api.put(`/users/${id}/role`, { role });
  return response.data;
};

// Role Management Services
export const getRolesAPI = async () => {
  const response = await api.get('/roles');
  return response.data;
};

export const createRoleAPI = async (roleData) => {
  const response = await api.post('/roles', roleData);
  return response.data;
};

export const updateRoleAPI = async (id, roleData) => {
  const response = await api.put(`/roles/${id}`, roleData);
  return response.data;
};

export const deleteRoleAPI = async (id) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};

// Permissions control board APIs
export const getPermissionsAPI = async () => {
  const response = await api.get('/users/permissions');
  return response.data;
};

export const updatePermissionAPI = async (id, data) => {
  const response = await api.put(`/users/permissions/${id}`, data);
  return response.data;
};

export const getMyPermissionsAPI = async () => {
  const response = await api.get('/menus/my-permissions');
  return response.data;
};

export const updateProfileAPI = async (data) => {
  const response = await api.put('/users/profile', data);
  return response.data;
};

export const deleteAccountAPI = async () => {
  const response = await api.delete('/users/profile');
  return response.data;
};

// Dynamic Permission Action Configuration APIs
export const getPermissionActionsAPI = async () => {
  const response = await api.get('/permission-actions');
  return response.data;
};

export const createPermissionActionAPI = async (actionData) => {
  const response = await api.post('/permission-actions', actionData);
  return response.data;
};

export const updatePermissionActionAPI = async (id, actionData) => {
  const response = await api.put(`/permission-actions/${id}`, actionData);
  return response.data;
};

export const deletePermissionActionAPI = async (id) => {
  const response = await api.delete(`/permission-actions/${id}`);
  return response.data;
};

// Menu Management Services
export const getVisibleMenusAPI = async () => {
  const response = await api.get('/menus');
  return response.data;
};

export const getAllMenusAPI = async () => {
  const response = await api.get('/menus/all');
  return response.data;
};

export const createMenuAPI = async (menuData) => {
  const response = await api.post('/menus', menuData);
  return response.data;
};

export const updateMenuAPI = async (id, menuData) => {
  const response = await api.put(`/menus/${id}`, menuData);
  return response.data;
};

export const deleteMenuAPI = async (id) => {
  const response = await api.delete(`/menus/${id}`);
  return response.data;
};

export const transferMenuPermissionsAPI = async (transferData) => {
  const response = await api.post('/menus/transfer', transferData);
  return response.data;
};

// Academy Taxonomy Services
export const getBoardsAPI = async () => {
  const response = await api.get('/academy/boards');
  return response.data;
};
export const createBoardAPI = async (data) => {
  const response = await api.post('/academy/boards', data);
  return response.data;
};
export const updateBoardAPI = async (id, data) => {
  const response = await api.put(`/academy/boards/${id}`, data);
  return response.data;
};
export const deleteBoardAPI = async (id) => {
  const response = await api.delete(`/academy/boards/${id}`);
  return response.data;
};

export const getClassesAPI = async (boardId) => {
  const response = await api.get('/academy/classes', { params: boardId ? { boardId } : {} });
  return response.data;
};
export const createClassAPI = async (data) => {
  const response = await api.post('/academy/classes', data);
  return response.data;
};
export const updateClassAPI = async (id, data) => {
  const response = await api.put(`/academy/classes/${id}`, data);
  return response.data;
};
export const deleteClassAPI = async (id) => {
  const response = await api.delete(`/academy/classes/${id}`);
  return response.data;
};

export const getSubjectsAPI = async (classId) => {
  const response = await api.get('/academy/subjects', { params: classId ? { classId } : {} });
  return response.data;
};
export const createSubjectAPI = async (data) => {
  const response = await api.post('/academy/subjects', data);
  return response.data;
};
export const updateSubjectAPI = async (id, data) => {
  const response = await api.put(`/academy/subjects/${id}`, data);
  return response.data;
};
export const deleteSubjectAPI = async (id) => {
  const response = await api.delete(`/academy/subjects/${id}`);
  return response.data;
};

export const getCategoriesAPI = async (subjectId) => {
  const response = await api.get('/academy/categories', { params: subjectId ? { subjectId } : {} });
  return response.data;
};
export const createCategoryAPI = async (data) => {
  const response = await api.post('/academy/categories', data);
  return response.data;
};
export const updateCategoryAPI = async (id, data) => {
  const response = await api.put(`/academy/categories/${id}`, data);
  return response.data;
};
export const deleteCategoryAPI = async (id) => {
  const response = await api.delete(`/academy/categories/${id}`);
  return response.data;
};

// Products Services
export const getProductsAPI = async (categoryId, page = 1, limit = 10) => {
  const params = { page, limit };
  if (categoryId) params.categoryId = categoryId;
  const response = await api.get('/products', { params });
  return response.data;
};
export const createProductAPI = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};
export const updateProductAPI = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};
export const deleteProductAPI = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// Activity Logging Services
export const getActivityLogsAPI = async (page = 1, limit = 20) => {
  const response = await api.get('/activity', { params: { page, limit } });
  return response.data;
};

export const logVisitAPI = async (path, name) => {
  const response = await api.post('/activity/log-visit', { path, name });
  return response.data;
};

// System Settings Services
export const getSettingsAPI = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettingsAPI = async (key, value) => {
  const response = await api.put(`/settings/${key}`, { value });
  return response.data;
};

// School Visits Services
export const createVisitAPI = async (formData) => {
  const response = await api.post('/visits', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getVisitsAPI = async (page = 1, limit = 10) => {
  const response = await api.get('/visits', { params: { page, limit } });
  return response.data;
};

export default api;
