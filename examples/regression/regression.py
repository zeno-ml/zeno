import math
import os
import numpy as np
from sklearn.linear_model import LinearRegression

def generate_linear_simple(beta, n, std_dev):
    # linear model: y=beta*x+eplison, assumes x is an array from 1 to n
    x = np.arange(1,n+1)
    e = np.random.randn(n) * std_dev
    y = x * beta + e
    return y

def index_smallest_coef(arr):
    # assumes arr is num_slices x num_models 2d array
    num_slices, num_models = arr.shape
    coefs = np.zeros(num_slices)
    for i in range(num_slices):
        x = np.arange(1,num_models+1)
        y = arr[i]
        model = LinearRegression().fit(x.reshape(-1, 1), y)
        coefs[i] = model.coef_
    min_index = np.argmin(coefs)
    print(coefs)
    print('Slice with smallest coefficient:', min_index)
    return min_index

def index_largest_var(arr):
    # assumes arr is num_slices x num_models 2d array
    vars = np.var(arr, axis=1)
    max_index = np.argmax(vars)
    print('Slice with largest variance:', max_index)
    return max_index

def weighted_selection(arr, weight):
    # arr: num_slices x num_models 2d array
    # weight: 1 x num_slices 2d array
    # weighted average calculation: sum(a * weights) / sum(weights)
    weighted_avg = np.average(arr, axis=0, weights=weight)
    max_index = np.argmax(weighted_avg)
    print('Model with largest weighted accuracy:', max_index)
    return max_index

def Euclidean_most_similar_pair(arr):
    num_slices, num_models = arr.shape
    distance = np.zeros((num_models, num_models))
    for i in range(num_models):
        for j in range(i+1, num_models):
            model_i = arr[:,i]
            model_j = arr[:,j]
            distance[i][j] = np.linalg.norm(model_i - model_j)
    distance_list = (np.reshape(distance, distance.size)).tolist()
    distance_min = min(d for d in distance_list if d > 0)
    pair_row, pair_col  = np.where(distance == distance_min)
    print('Most similar models based on Euclidean distance: ', 'Model', pair_row[0], 'and Model', pair_col[0])
    if (pair_row.size > 1):
        for i in range(1, pair_row.size):
            print('Model', pair_row[i], 'and Model', pair_col[i], '\n')
    return pair_row, pair_col

# example 1: finding smallest slope (from linear model)
beta_array = np.array([5, 10, 15, 20])
n = 20
std_dev = 20
array_tmp = np.empty((0,n), float)
for beta in beta_array:
    array_tmp = np.append(array_tmp, [generate_linear_simple(beta, n, std_dev)], axis=0)

index_smallest_coef(array_tmp)

# example 2: finding largest variance (from normal distribution)
n = 100
mu = 0
sigma_array = np.array([5, 10, 15, 20])
array_tmp = np.empty((0,n), float)
for sigma in sigma_array:
    array_tmp = np.append(array_tmp, [np.random.normal(mu, sigma, n)], axis=0)

index_largest_var(array_tmp)

# example 3: weigh different slices by importance, which model to pick
array_tmp = np.array([[5, 10, 15],[20, 10, 15],[5, 5, 15]])
weight = np.array([1, 1, 2])
weighted_selection(array_tmp, weight)

n = 20
beta_array = np.array([5, 10, 15, 20])
std_dev_array = np.array([10, 10, 5, 5])
array_tmp = np.empty((0,n), float)
for i in range(beta_array.size):
    beta = beta_array[i]
    std_dev = std_dev_array[i]
    array_tmp = np.append(array_tmp, [generate_linear_simple(beta, n, std_dev)], axis=0)
weight = np.random.randn(4)
weighted_selection(array_tmp, weight)

# example 4: which models are the most “similar”
array_tmp = np.array([[5, 10, 15],[20, 10, 15],[5, 5, 15]])
Euclidean_most_similar_pair(array_tmp)

n = 30
mu_array = np.array([10, 10, 15, 5])
sigma_array = np.array([5, 10, 15, 20])
array_tmp = np.empty((0,n), float)
for i in range(mu_array.size):
    mu = mu_array[i]
    sigma = sigma_array[i]
    array_tmp = np.append(array_tmp, [np.random.normal(mu, sigma, n)], axis=0)
Euclidean_most_similar_pair(array_tmp)