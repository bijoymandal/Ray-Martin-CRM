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
      localStorage.removeItem('crm_token');
      // If we are in the browser, redirect to login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
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
export const getContactsAPI = async () => {
  const response = await api.get('/contacts');
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
export const getDealsAPI = async () => {
  const response = await api.get('/deals');
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
export const getUsersAPI = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateUserRoleAPI = async (id, role) => {
  const response = await api.put(`/users/${id}/role`, { role });
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
export const getProductsAPI = async (categoryId) => {
  const response = await api.get('/products', { params: categoryId ? { categoryId } : {} });
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

export default api;
