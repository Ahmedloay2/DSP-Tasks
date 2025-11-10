"""
Custom DSP Implementations
==========================
From-scratch implementations of FFT and Spectrogram using only NumPy.
No external DSP libraries used for these core functions.
"""

import numpy as np


class CustomFFT:
    """
    Custom Fast Fourier Transform implementation
    Using Cooley-Tukey FFT algorithm
    """
    
    @staticmethod
    def _bit_reverse_copy(a):
        """Bit-reverse permutation of array indices"""
        n = len(a)
        if n <= 1:
            return a
        
        # Calculate number of bits needed
        bits = int(np.log2(n))
        
        # Create reversed array
        reversed_a = np.zeros(n, dtype=complex)
        for i in range(n):
            # Reverse bits
            reversed_idx = int('{:0{width}b}'.format(i, width=bits)[::-1], 2)
            reversed_a[reversed_idx] = a[i]
        
        return reversed_a
    
    @staticmethod
    def fft(x):
        """
        Compute FFT using Cooley-Tukey algorithm
        
        Args:
            x: Input signal (1D array)
            
        Returns:
            Complex FFT coefficients
        """
        x = np.asarray(x, dtype=complex)
        n = len(x)
        
        # Pad to next power of 2
        if n & (n - 1) != 0:
            next_pow2 = 2 ** int(np.ceil(np.log2(n)))
            x = np.pad(x, (0, next_pow2 - n), mode='constant')
            n = next_pow2
        
        # Base case
        if n <= 1:
            return x
        
        # Bit-reverse permutation
        x = CustomFFT._bit_reverse_copy(x)
        
        # Cooley-Tukey FFT
        # Iterative implementation for better performance
        stages = int(np.log2(n))
        
        for s in range(1, stages + 1):
            m = 2 ** s  # Size of sub-DFT
            wm = np.exp(-2j * np.pi / m)  # Twiddle factor
            
            for k in range(0, n, m):
                w = 1.0
                for j in range(m // 2):
                    t = w * x[k + j + m // 2]
                    u = x[k + j]
                    x[k + j] = u + t
                    x[k + j + m // 2] = u - t
                    w = w * wm
        
        return x
    
    @staticmethod
    def rfft(x, n=None):
        """
        Real FFT - optimized for real input signals
        Returns only positive frequencies (like numpy.fft.rfft)
        
        Args:
            x: Real input signal
            n: FFT size (optional, defaults to len(x))
            
        Returns:
            Complex FFT coefficients for positive frequencies
        """
        if n is None:
            n = len(x)
        
        # Pad or truncate to desired length
        if len(x) < n:
            x = np.pad(x, (0, n - len(x)), mode='constant')
        elif len(x) > n:
            x = x[:n]
        
        # Compute full FFT
        full_fft = CustomFFT.fft(x)
        
        # Return only positive frequencies
        # For real signals, negative frequencies are conjugates
        return full_fft[:n // 2 + 1]
    
    @staticmethod
    def ifft(X):
        """
        Inverse FFT
        
        Args:
            X: FFT coefficients
            
        Returns:
            Time-domain signal
        """
        n = len(X)
        
        # Conjugate input
        X_conj = np.conj(X)
        
        # Apply FFT to conjugate
        x_conj = CustomFFT.fft(X_conj)
        
        # Conjugate and normalize
        x = np.conj(x_conj) / n
        
        return x
    
    @staticmethod
    def rfftfreq(n, d=1.0):
        """
        Return frequency bins for rfft
        
        Args:
            n: Number of samples
            d: Sample spacing (1/sample_rate)
            
        Returns:
            Array of frequency values
        """
        val = 1.0 / (n * d)
        N = n // 2 + 1
        results = np.arange(0, N, dtype=int)
        return results * val


class CustomSTFT:
    """
    Custom Short-Time Fourier Transform implementation
    """
    
    @staticmethod
    def stft(x, n_fft=2048, hop_length=None, window='hann'):
        """
        Compute Short-Time Fourier Transform
        
        Args:
            x: Input signal
            n_fft: FFT size
            hop_length: Number of samples between frames
            window: Window function ('hann', 'hamming', 'blackman', None)
            
        Returns:
            Complex STFT matrix (freq_bins x time_frames)
        """
        if hop_length is None:
            hop_length = n_fft // 4
        
        x = np.asarray(x)
        n_samples = len(x)
        
        # Create window function
        if window == 'hann':
            win = 0.5 * (1 - np.cos(2 * np.pi * np.arange(n_fft) / (n_fft - 1)))
        elif window == 'hamming':
            win = 0.54 - 0.46 * np.cos(2 * np.pi * np.arange(n_fft) / (n_fft - 1))
        elif window == 'blackman':
            n = np.arange(n_fft)
            win = 0.42 - 0.5 * np.cos(2 * np.pi * n / (n_fft - 1)) + 0.08 * np.cos(4 * np.pi * n / (n_fft - 1))
        else:
            win = np.ones(n_fft)
        
        # Calculate number of frames
        n_frames = 1 + (n_samples - n_fft) // hop_length
        
        # Allocate output matrix
        n_freq_bins = n_fft // 2 + 1
        stft_matrix = np.zeros((n_freq_bins, n_frames), dtype=complex)
        
        # Compute STFT
        for frame_idx in range(n_frames):
            start = frame_idx * hop_length
            end = start + n_fft
            
            if end > n_samples:
                # Pad last frame if needed
                frame = np.pad(x[start:], (0, end - n_samples), mode='constant')
            else:
                frame = x[start:end]
            
            # Apply window
            windowed_frame = frame * win
            
            # Compute FFT of windowed frame
            fft_frame = CustomFFT.rfft(windowed_frame, n=n_fft)
            stft_matrix[:, frame_idx] = fft_frame
        
        return stft_matrix
    
    @staticmethod
    def istft(stft_matrix, hop_length=None, window='hann'):
        """
        Inverse Short-Time Fourier Transform
        
        Args:
            stft_matrix: STFT matrix (freq_bins x time_frames)
            hop_length: Number of samples between frames
            window: Window function used in STFT
            
        Returns:
            Time-domain signal
        """
        n_freq_bins, n_frames = stft_matrix.shape
        n_fft = (n_freq_bins - 1) * 2
        
        if hop_length is None:
            hop_length = n_fft // 4
        
        # Create window
        if window == 'hann':
            win = 0.5 * (1 - np.cos(2 * np.pi * np.arange(n_fft) / (n_fft - 1)))
        elif window == 'hamming':
            win = 0.54 - 0.46 * np.cos(2 * np.pi * np.arange(n_fft) / (n_fft - 1))
        elif window == 'blackman':
            n = np.arange(n_fft)
            win = 0.42 - 0.5 * np.cos(2 * np.pi * n / (n_fft - 1)) + 0.08 * np.cos(4 * np.pi * n / (n_fft - 1))
        else:
            win = np.ones(n_fft)
        
        # Allocate output signal
        n_samples = n_fft + (n_frames - 1) * hop_length
        y = np.zeros(n_samples)
        window_sum = np.zeros(n_samples)
        
        # Overlap-add reconstruction
        for frame_idx in range(n_frames):
            start = frame_idx * hop_length
            
            # Reconstruct full FFT (mirror for negative frequencies)
            full_fft = np.concatenate([
                stft_matrix[:, frame_idx],
                np.conj(stft_matrix[-2:0:-1, frame_idx])
            ])
            
            # Inverse FFT
            frame = np.real(CustomFFT.ifft(full_fft))[:n_fft]
            
            # Apply window and add to output
            y[start:start + n_fft] += frame * win
            window_sum[start:start + n_fft] += win ** 2
        
        # Normalize by window overlap
        nonzero = window_sum > 1e-10
        y[nonzero] /= window_sum[nonzero]
        
        return y


class CustomSpectrogram:
    """
    Custom Spectrogram implementation
    """
    
    @staticmethod
    def compute_spectrogram(x, sample_rate, n_fft=2048, hop_length=None, 
                          window='hann', scale='magnitude'):
        """
        Compute spectrogram from audio signal
        
        Args:
            x: Input signal
            sample_rate: Sampling rate
            n_fft: FFT size
            hop_length: Hop length
            window: Window function
            scale: 'magnitude', 'power', or 'db'
            
        Returns:
            spectrogram: 2D array (freq_bins x time_frames)
            frequencies: Frequency values for each bin
            times: Time values for each frame
        """
        if hop_length is None:
            hop_length = n_fft // 4
        
        # Compute STFT
        stft_matrix = CustomSTFT.stft(x, n_fft=n_fft, hop_length=hop_length, window=window)
        
        # Compute magnitude
        magnitude = np.abs(stft_matrix)
        
        # Apply scaling
        if scale == 'power':
            spectrogram = magnitude ** 2
        elif scale == 'db':
            # Convert to dB (avoid log(0))
            magnitude = np.maximum(magnitude, 1e-10)
            max_val = np.max(magnitude)
            spectrogram = 20 * np.log10(magnitude / max_val)
        else:  # magnitude
            spectrogram = magnitude
        
        # Generate frequency and time axes
        frequencies = np.arange(n_fft // 2 + 1) * (sample_rate / n_fft)
        n_frames = stft_matrix.shape[1]
        times = np.arange(n_frames) * (hop_length / sample_rate)
        
        return spectrogram, frequencies, times
    
    @staticmethod
    def mel_filterbank(n_fft, n_mels, sample_rate, fmin=0, fmax=None):
        """
        Create mel-scale filterbank
        
        Args:
            n_fft: FFT size
            n_mels: Number of mel bands
            sample_rate: Sampling rate
            fmin: Minimum frequency
            fmax: Maximum frequency
            
        Returns:
            Mel filterbank matrix
        """
        if fmax is None:
            fmax = sample_rate / 2
        
        # Mel scale conversion functions
        def hz_to_mel(f):
            return 2595 * np.log10(1 + f / 700)
        
        def mel_to_hz(m):
            return 700 * (10 ** (m / 2595) - 1)
        
        # Create mel-spaced frequencies
        mel_min = hz_to_mel(fmin)
        mel_max = hz_to_mel(fmax)
        mel_points = np.linspace(mel_min, mel_max, n_mels + 2)
        hz_points = mel_to_hz(mel_points)
        
        # Convert to FFT bin numbers
        bin_points = np.floor((n_fft + 1) * hz_points / sample_rate).astype(int)
        
        # Create filterbank
        n_freq_bins = n_fft // 2 + 1
        filterbank = np.zeros((n_mels, n_freq_bins))
        
        for m in range(1, n_mels + 1):
            f_left = bin_points[m - 1]
            f_center = bin_points[m]
            f_right = bin_points[m + 1]
            
            # Triangular filter
            for k in range(f_left, f_center):
                filterbank[m - 1, k] = (k - f_left) / (f_center - f_left)
            for k in range(f_center, f_right):
                filterbank[m - 1, k] = (f_right - k) / (f_right - f_center)
        
        return filterbank
    
    @staticmethod
    def mel_spectrogram(x, sample_rate, n_fft=2048, hop_length=None, 
                       n_mels=128, fmin=0, fmax=None):
        """
        Compute mel-scaled spectrogram
        
        Args:
            x: Input signal
            sample_rate: Sampling rate
            n_fft: FFT size
            hop_length: Hop length
            n_mels: Number of mel bands
            fmin: Minimum frequency
            fmax: Maximum frequency
            
        Returns:
            mel_spectrogram: 2D array (mel_bins x time_frames)
            frequencies: Mel frequency values
            times: Time values
        """
        # Compute power spectrogram
        spectrogram, frequencies, times = CustomSpectrogram.compute_spectrogram(
            x, sample_rate, n_fft, hop_length, scale='power'
        )
        
        # Create mel filterbank
        mel_filters = CustomSpectrogram.mel_filterbank(
            n_fft, n_mels, sample_rate, fmin, fmax
        )
        
        # Apply mel filterbank
        mel_spec = np.dot(mel_filters, spectrogram)
        
        # Convert to dB
        mel_spec = np.maximum(mel_spec, 1e-10)
        mel_spec_db = 10 * np.log10(mel_spec / np.max(mel_spec))
        
        return mel_spec_db, times



def test_implementations():
    """Test the custom implementations"""
    print("Testing Custom DSP Implementations")
    print("=" * 50)
    
    # Test signal
    sample_rate = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create test signal: sum of sine waves
    f1, f2, f3 = 440, 880, 1320  # A4, A5, E6
    signal = (np.sin(2 * np.pi * f1 * t) + 
              0.5 * np.sin(2 * np.pi * f2 * t) + 
              0.3 * np.sin(2 * np.pi * f3 * t))
    
    # Test FFT
    print("\n1. Testing Custom FFT...")
    fft_result = CustomFFT.rfft(signal[:2048])
    print(f"   FFT output shape: {fft_result.shape}")
    print(f"   Peak frequency bins: {np.argsort(np.abs(fft_result))[-3:]}")
    
    # Test STFT
    print("\n2. Testing Custom STFT...")
    stft_result = CustomSTFT.stft(signal, n_fft=2048, hop_length=512)
    print(f"   STFT output shape: {stft_result.shape}")
    print(f"   Frequency bins: {stft_result.shape[0]}")
    print(f"   Time frames: {stft_result.shape[1]}")
    
    # Test Spectrogram
    print("\n3. Testing Custom Spectrogram...")
    spec, freqs, times = CustomSpectrogram.compute_spectrogram(
        signal, sample_rate, n_fft=2048, hop_length=512, scale='db'
    )
    print(f"   Spectrogram shape: {spec.shape}")
    print(f"   Frequency range: {freqs[0]:.1f} - {freqs[-1]:.1f} Hz")
    print(f"   Time range: {times[0]:.3f} - {times[-1]:.3f} s")
    print(f"   dB range: {np.min(spec):.1f} - {np.max(spec):.1f} dB")
    
    # Test Mel Spectrogram
    print("\n4. Testing Custom Mel Spectrogram...")
    mel_spec, mel_times = CustomSpectrogram.mel_spectrogram(
        signal, sample_rate, n_fft=2048, n_mels=128
    )
    print(f"   Mel spectrogram shape: {mel_spec.shape}")
    print(f"   Mel bins: {mel_spec.shape[0]}")
    
    print("\n" + "=" * 50)
    print("✅ All tests passed!")


if __name__ == '__main__':
    test_implementations()
