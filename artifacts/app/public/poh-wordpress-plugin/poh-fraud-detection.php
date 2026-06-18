<?php
/**
 * Plugin Name:       PoH — Fraud Detection & Trust Intelligence
 * Plugin URI:        https://po-h-replit.replit.app
 * Description:       Automatically scores every visitor session for bot, proxy, and fraud signals. Tracks conversions from WooCommerce purchases, form submissions, and custom events. No coding required.
 * Version:           1.0.0
 * Author:            PoH Trust Intelligence
 * Author URI:        https://po-h-replit.replit.app
 * License:           GPL v2 or later
 * Text Domain:       poh-fraud-detection
 * Requires at least: 5.8
 * Requires PHP:      7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'POH_VERSION', '1.0.0' );
define( 'POH_PLUGIN_FILE', __FILE__ );
define( 'POH_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'POH_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'POH_OPTION_KEY', 'poh_settings' );
define( 'POH_SDK_URL', 'https://po-h-replit.replit.app/poh.js' );
define( 'POH_API_URL', 'https://po-h-replit.replit.app/api' );

// ─── Settings helpers ────────────────────────────────────────────────────────

function poh_get_settings() {
	$defaults = array(
		'sdk_key'            => '',
		'track_woocommerce'  => '1',
		'track_forms'        => '1',
		'track_cf7'          => '1',
		'track_ninja_forms'  => '1',
		'exclude_admin'      => '1',
		'debug_mode'         => '0',
	);
	return wp_parse_args( get_option( POH_OPTION_KEY, array() ), $defaults );
}

function poh_is_configured() {
	$s = poh_get_settings();
	return ! empty( $s['sdk_key'] );
}

function poh_should_track() {
	$s = poh_get_settings();
	if ( ! poh_is_configured() ) {
		return false;
	}
	if ( $s['exclude_admin'] === '1' && current_user_can( 'manage_options' ) ) {
		return false;
	}
	return true;
}

// ─── SDK injection ───────────────────────────────────────────────────────────

add_action( 'wp_head', 'poh_inject_sdk', 1 );
function poh_inject_sdk() {
	if ( ! poh_should_track() ) {
		return;
	}
	$s       = poh_get_settings();
	$sdk_key = esc_js( $s['sdk_key'] );
	$api_url = esc_js( POH_API_URL );
	$debug   = $s['debug_mode'] === '1' ? 'true' : 'false';
	?>
<!-- PoH Trust Intelligence SDK v<?php echo POH_VERSION; ?> -->
<script>
(function(w,d,k){
  w._pohq=w._pohq||[];
  var s=d.createElement('script');
  s.src='<?php echo esc_url( POH_SDK_URL ); ?>';
  s.async=true;
  s.onload=function(){
    w.poh&&w.poh.init({
      sdkKey:k,
      apiBase:'<?php echo $api_url; ?>',
      debug:<?php echo $debug; ?>,
      autoTrack:true
    });
  };
  d.head.appendChild(s);
})(window,document,'<?php echo $sdk_key; ?>');
</script>
	<?php
}

// ─── WooCommerce conversion tracking ────────────────────────────────────────

add_action( 'woocommerce_thankyou', 'poh_woocommerce_conversion', 10, 1 );
function poh_woocommerce_conversion( $order_id ) {
	$s = poh_get_settings();
	if ( ! poh_should_track() || $s['track_woocommerce'] !== '1' ) {
		return;
	}
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return;
	}
	$total    = (float) $order->get_total();
	$currency = esc_js( get_woocommerce_currency() );
	$order_id_safe = intval( $order_id );
	?>
<script>
(function wait() {
  if (window.poh && window.poh.convert) {
    window.poh.convert({
      type: 'purchase',
      value: <?php echo json_encode( $total ); ?>,
      currency: '<?php echo $currency; ?>',
      orderId: '<?php echo $order_id_safe; ?>'
    });
  } else {
    setTimeout(wait, 200);
  }
})();
</script>
	<?php
}

// Also track on checkout payment page (early signal)
add_action( 'woocommerce_payment_complete', 'poh_woocommerce_payment_complete', 10, 1 );
function poh_woocommerce_payment_complete( $order_id ) {
	// Server-side hook — optionally call PoH REST API directly
	$s = poh_get_settings();
	if ( $s['track_woocommerce'] !== '1' || empty( $s['sdk_key'] ) ) {
		return;
	}
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return;
	}
	$payload = array(
		'sdk_key'    => $s['sdk_key'],
		'session_id' => WC()->session ? WC()->session->get( 'poh_session_id', '' ) : '',
		'event_type' => 'conversion',
		'conversion' => array(
			'type'     => 'purchase',
			'value'    => (float) $order->get_total(),
			'currency' => get_woocommerce_currency(),
		),
	);
	wp_remote_post(
		trailingslashit( POH_API_URL ) . 'collect',
		array(
			'body'    => wp_json_encode( $payload ),
			'headers' => array( 'Content-Type' => 'application/json' ),
			'timeout' => 3,
			'blocking' => false,
		)
	);
}

// ─── Generic HTML form tracking (JavaScript) ─────────────────────────────────

add_action( 'wp_footer', 'poh_form_tracking_script', 99 );
function poh_form_tracking_script() {
	$s = poh_get_settings();
	if ( ! poh_should_track() || $s['track_forms'] !== '1' ) {
		return;
	}
	?>
<script>
(function() {
  function waitForPoH(fn) {
    if (window.poh && window.poh.convert) { fn(); }
    else { setTimeout(function(){ waitForPoH(fn); }, 300); }
  }
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    // Skip WooCommerce checkout / cart forms (tracked separately)
    var cls = form.className || '';
    if (cls.indexOf('woocommerce') !== -1 || cls.indexOf('cart') !== -1) return;
    // Skip login / register forms
    if (form.id === 'loginform' || form.id === 'registerform') return;
    waitForPoH(function() {
      window.poh.convert({ type: 'lead', formId: form.id || form.action || 'unknown' });
    });
  }, true);
})();
</script>
	<?php
}

// ─── Contact Form 7 tracking ─────────────────────────────────────────────────

add_action( 'wpcf7_mail_sent', 'poh_cf7_conversion', 10, 1 );
function poh_cf7_conversion( $contact_form ) {
	$s = poh_get_settings();
	if ( ! poh_should_track() || $s['track_cf7'] !== '1' ) {
		return;
	}
	$form_id   = intval( $contact_form->id() );
	$form_name = esc_js( $contact_form->title() );
	?>
<script>
(function wait() {
  if (window.poh && window.poh.convert) {
    window.poh.convert({ type: 'lead', formId: '<?php echo $form_id; ?>', formName: '<?php echo $form_name; ?>' });
  } else { setTimeout(wait, 200); }
})();
</script>
	<?php
}

// ─── Admin settings page ─────────────────────────────────────────────────────

add_action( 'admin_menu', 'poh_admin_menu' );
function poh_admin_menu() {
	add_options_page(
		__( 'PoH Fraud Detection', 'poh-fraud-detection' ),
		__( 'PoH Fraud Detection', 'poh-fraud-detection' ),
		'manage_options',
		'poh-fraud-detection',
		'poh_settings_page'
	);
}

add_action( 'admin_init', 'poh_register_settings' );
function poh_register_settings() {
	register_setting( 'poh_settings_group', POH_OPTION_KEY, array(
		'sanitize_callback' => 'poh_sanitize_settings',
	) );
}

function poh_sanitize_settings( $input ) {
	$clean = array();
	$clean['sdk_key']            = isset( $input['sdk_key'] ) ? sanitize_text_field( $input['sdk_key'] ) : '';
	$clean['track_woocommerce']  = isset( $input['track_woocommerce'] ) ? '1' : '0';
	$clean['track_forms']        = isset( $input['track_forms'] ) ? '1' : '0';
	$clean['track_cf7']          = isset( $input['track_cf7'] ) ? '1' : '0';
	$clean['track_ninja_forms']  = isset( $input['track_ninja_forms'] ) ? '1' : '0';
	$clean['exclude_admin']      = isset( $input['exclude_admin'] ) ? '1' : '0';
	$clean['debug_mode']         = isset( $input['debug_mode'] ) ? '1' : '0';
	return $clean;
}

function poh_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( isset( $_GET['settings-updated'] ) ) {
		add_settings_error( 'poh_messages', 'poh_message', __( 'Settings saved.', 'poh-fraud-detection' ), 'updated' );
	}
	settings_errors( 'poh_messages' );
	$s = poh_get_settings();
	?>
<div class="wrap">
  <h1 style="display:flex;align-items:center;gap:10px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:#0d1f14;border:1px solid #34d39955;border-radius:6px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#34D399"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/></svg>
    </span>
    PoH — Fraud Detection &amp; Trust Intelligence
  </h1>
  <p style="color:#666;">Real-time bot detection, fraud scoring, and conversion quality analysis for your WordPress site.</p>

  <?php if ( poh_is_configured() ): ?>
  <div style="background:#0a1f0e;border:1px solid #34d39940;border-radius:6px;padding:12px 16px;margin:16px 0;display:flex;align-items:center;gap:10px;">
    <span style="color:#34D399;font-size:18px;">✓</span>
    <div>
      <strong style="color:#34D399;">SDK Active</strong>
      <p style="margin:2px 0 0;color:#888;font-size:13px;">PoH is scoring every visitor session on your site.</p>
    </div>
  </div>
  <?php else: ?>
  <div style="background:#1f0a0a;border:1px solid #f8717140;border-radius:6px;padding:12px 16px;margin:16px 0;display:flex;align-items:center;gap:10px;">
    <span style="color:#F87171;font-size:18px;">!</span>
    <div>
      <strong style="color:#F87171;">SDK Key Required</strong>
      <p style="margin:2px 0 0;color:#888;font-size:13px;">Enter your SDK key below to activate fraud detection. Find it in <a href="https://po-h-replit.replit.app/app/onboarding" target="_blank" style="color:#60A5FA;">PoH → Install SDK</a>.</p>
    </div>
  </div>
  <?php endif; ?>

  <form method="post" action="options.php">
    <?php settings_fields( 'poh_settings_group' ); ?>
    <table class="form-table" role="presentation">
      <tr>
        <th scope="row"><label for="poh_sdk_key">SDK Key</label></th>
        <td>
          <input type="text" id="poh_sdk_key" name="<?php echo POH_OPTION_KEY; ?>[sdk_key]"
            value="<?php echo esc_attr( $s['sdk_key'] ); ?>"
            class="regular-text" placeholder="poh_live_xxxxxxxxxxxxxxxx"
            style="font-family:monospace;" />
          <p class="description">Your site SDK key from the <a href="https://po-h-replit.replit.app/app/onboarding" target="_blank">PoH Install SDK page</a>.</p>
        </td>
      </tr>
      <tr>
        <th scope="row">Conversion Tracking</th>
        <td>
          <fieldset>
            <label><input type="checkbox" name="<?php echo POH_OPTION_KEY; ?>[track_woocommerce]" value="1" <?php checked( $s['track_woocommerce'], '1' ); ?>> WooCommerce purchases (thank-you page)</label><br>
            <label><input type="checkbox" name="<?php echo POH_OPTION_KEY; ?>[track_forms]" value="1" <?php checked( $s['track_forms'], '1' ); ?>> Generic HTML form submissions</label><br>
            <label><input type="checkbox" name="<?php echo POH_OPTION_KEY; ?>[track_cf7]" value="1" <?php checked( $s['track_cf7'], '1' ); ?>> Contact Form 7 submissions</label><br>
            <label><input type="checkbox" name="<?php echo POH_OPTION_KEY; ?>[track_ninja_forms]" value="1" <?php checked( $s['track_ninja_forms'], '1' ); ?>> Ninja Forms submissions</label>
          </fieldset>
        </td>
      </tr>
      <tr>
        <th scope="row">Options</th>
        <td>
          <fieldset>
            <label><input type="checkbox" name="<?php echo POH_OPTION_KEY; ?>[exclude_admin]" value="1" <?php checked( $s['exclude_admin'], '1' ); ?>> Do not track logged-in administrators</label><br>
            <label><input type="checkbox" name="<?php echo POH_OPTION_KEY; ?>[debug_mode]" value="1" <?php checked( $s['debug_mode'], '1' ); ?>> Enable debug mode (logs to browser console)</label>
          </fieldset>
        </td>
      </tr>
    </table>
    <?php submit_button( 'Save Settings' ); ?>
  </form>

  <hr>
  <h2>Manual Conversion Tracking (Shortcode)</h2>
  <p>Use the shortcode on any page or post to fire a conversion event when the page is viewed:</p>
  <pre style="background:#f6f7f7;padding:12px;border-radius:4px;">[poh_convert type="lead"]</pre>
  <p>Supported types: <code>lead</code>, <code>signup</code>, <code>purchase</code></p>

  <h2>Custom JavaScript</h2>
  <p>Track conversions anywhere with:</p>
  <pre style="background:#f6f7f7;padding:12px;border-radius:4px;">window.poh.convert({ type: 'lead', value: 49.00, currency: 'USD' });</pre>

  <hr>
  <p style="color:#888;font-size:12px;">PoH Fraud Detection v<?php echo POH_VERSION; ?> — <a href="https://po-h-replit.replit.app" target="_blank">Visit Dashboard</a></p>
</div>
	<?php
}

// ─── Shortcode ───────────────────────────────────────────────────────────────

add_shortcode( 'poh_convert', 'poh_convert_shortcode' );
function poh_convert_shortcode( $atts ) {
	if ( ! poh_should_track() ) {
		return '';
	}
	$atts = shortcode_atts( array(
		'type'     => 'lead',
		'value'    => '0',
		'currency' => 'USD',
	), $atts, 'poh_convert' );
	$type     = esc_js( $atts['type'] );
	$value    = floatval( $atts['value'] );
	$currency = esc_js( $atts['currency'] );
	ob_start();
	?>
<script>
(function wait() {
  if (window.poh && window.poh.convert) {
    window.poh.convert({ type: '<?php echo $type; ?>', value: <?php echo $value; ?>, currency: '<?php echo $currency; ?>' });
  } else { setTimeout(wait, 250); }
})();
</script>
	<?php
	return ob_get_clean();
}

// ─── Activation / deactivation ───────────────────────────────────────────────

register_activation_hook( __FILE__, 'poh_activate' );
function poh_activate() {
	if ( get_option( POH_OPTION_KEY ) === false ) {
		add_option( POH_OPTION_KEY, array(
			'sdk_key'           => '',
			'track_woocommerce' => '1',
			'track_forms'       => '1',
			'track_cf7'         => '1',
			'track_ninja_forms' => '1',
			'exclude_admin'     => '1',
			'debug_mode'        => '0',
		) );
	}
}

register_deactivation_hook( __FILE__, 'poh_deactivate' );
function poh_deactivate() {
	// Settings are preserved on deactivation; only removed on uninstall.
}
