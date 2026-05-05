import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stationService } from '../services/stationService';
import { reviewService } from '../services/reviewService';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';

const StationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [station, setStation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadStation();
    loadReviews();
    if (isAuthenticated) {
      checkFavorite();
    }
  }, [id, isAuthenticated]);

  const loadStation = async () => {
    try {
      const data = await stationService.getStation(id);
      setStation(data.station);
      setError(null);
    } catch (err) {
      setError('Failed to load station');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewService.getReviews(id);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const checkFavorite = async () => {
    try {
      const data = await favoriteService.getFavorites();
      const favoriteIds = data.favorites.map((f) => f._id || f);
      setIsFavorite(favoriteIds.includes(id));
    } catch (err) {
      console.error('Failed to check favorite:', err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const data = await favoriteService.toggleFavorite(id);
      setIsFavorite(data.isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewService.createReview(id, reviewForm.rating, reviewForm.comment);
      setReviewForm({ rating: 5, comment: '' });
      await loadReviews();
      await loadStation();
    } catch (err) {
      alert('Failed to submit review');
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">{error || 'Station not found'}</div>
      </div>
    );
  }

  const images = station.images && station.images.length > 0 ? station.images : [
    'https://images.unsplash.com/photo-1593941707882-a5bac6861eed?w=800',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Image Carousel */}
      <div className="relative mb-6">
        <div className="relative h-96 rounded-lg overflow-hidden">
          <img
            src={images[currentImageIndex]}
            alt={station.name}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
                }
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2"
              >
                →
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 rounded-full ${
                  idx === currentImageIndex ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{station.name}</h1>
              <p className="text-gray-600">{station.address}</p>
            </div>
            <button
              onClick={handleToggleFavorite}
              className={`px-4 py-2 rounded-md ${
                isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isFavorite ? '❤️ Remove Favorite' : '🤍 Add Favorite'}
            </button>
          </div>

          {/* Connectors */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Connectors</h2>
            <div className="flex flex-wrap gap-2">
              {station.connectors?.map((conn, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 bg-green-100 rounded-lg border border-green-300"
                >
                  <div className="font-semibold">{conn.type}</div>
                  <div className="text-sm text-gray-600">
                    {conn.powerKw} kW · {conn.count} available
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Availability</h2>
            <div className="text-lg">
              <span className="font-bold">{station.availability?.availableSlots || 0}</span> of{' '}
              <span className="font-bold">{station.availability?.totalSlots || 0}</span> slots
              available
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Price</h2>
            <div className="text-2xl font-bold text-green-600">
              ₹{station.pricePerKwh}/kWh
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Reviews ({station.reviewCount || reviews.length})
            </h2>
            {station.avgRating && (
              <div className="mb-4">
                <div className="text-2xl font-bold">
                  {station.avgRating.toFixed(1)} ⭐
                </div>
              </div>
            )}
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {review.userId?.name || 'Anonymous'}
                      </div>
                      <div className="text-yellow-500">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    {review.comment && <p className="text-gray-700">{review.comment}</p>}
                    <div className="text-sm text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Review Form */}
          {isAuthenticated && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Add Review</h2>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block mb-2">Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border rounded-md"
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} ⭐
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border rounded-md"
                    placeholder="Write your review..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Price</div>
                <div className="text-lg font-semibold">₹{station.pricePerKwh}/kWh</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Available Slots</div>
                <div className="text-lg font-semibold">
                  {station.availability?.availableSlots || 0} /{' '}
                  {station.availability?.totalSlots || 0}
                </div>
              </div>
              {station.ownerId && (
                <div>
                  <div className="text-sm text-gray-500">Owner</div>
                  <div className="text-lg font-semibold">{station.ownerId.name}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDetail;











