package org.opensharingtoolkit.nodeapp;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;

import android.app.Service;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.IBinder;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class NodeService extends Service {

	private static final String NODE_FILENAME = "node";
	private static final String TAG = "node-service";

	public static final String ACTION_INIT = "org.opensharingtoolkit.nodeapp.action.INIT";
	public static final String ACTION_START = "org.opensharingtoolkit.nodeapp.action.START";
	public static final String ACTION_STOP = "org.opensharingtoolkit.nodeapp.action.STOP";
	public static final String EXTRA_COMMAND = "command";

	private File mNodeApp;
	enum NodeState { NEW, EXTRACTING, FAILED, READY, STARTING, RUNNING, STOPPING };
	private NodeState mNodeState = NodeState.NEW;
	private boolean mStartWhenReady = false;
	private String mPendingCommand = null;
	private Process mNodeProcess;
	
	@Override
	public IBinder onBind(Intent arg0) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see android.app.Service#onCreate()
	 */
	@Override
	public void onCreate() {
		super.onCreate();
		// Make sure node file is copied out of assets into app files
		File fileDir = this.getFilesDir();
		mNodeApp = new File(fileDir, NODE_FILENAME);
		if (!mNodeApp.exists()) {
			Log.d(TAG,"Create node file");
			mNodeState = NodeState.EXTRACTING;
			ExtractFileTask task = new ExtractFileTask();
			task.execute(NODE_FILENAME);
		}
		else
			checkNodeApp();
	}
	private void checkNodeApp() {
		if (!mNodeApp.exists()) {
			mNodeState = NodeState.FAILED;
		}
		else {
			Log.d(TAG,"Node file exists");
			if (!mNodeApp.canExecute()) {
				if (!mNodeApp.setExecutable(true, false)) {
					mNodeState = NodeState.FAILED;
					Log.e(TAG,"Could not set Executable for "+mNodeApp);
				}
				else {
					Log.d(TAG,"Made executable: "+mNodeApp);
					mNodeState = NodeState.READY;
				}
			} else
				mNodeState = NodeState.READY;
		}
		if (mNodeState==NodeState.READY) {
			// try it out...!
			if (mStartWhenReady) {
				Log.d(TAG,"Doing delayed start");
				startNode();
			}
		}
	}
	private void startNode() {
		if (mNodeState!=NodeState.READY) {
			if (mNodeState==NodeState.EXTRACTING) {
				Log.d(TAG,"delay start for extraction");
				mStartWhenReady = true;
				return;
			}
			Log.e(TAG,"cannot startNode when "+mNodeState);
			return;
		}
		Log.d(TAG,"Start node...");
		mNodeState = NodeState.STARTING;
		// just print version :-)
		ProcessBuilder pbuilder = new ProcessBuilder(mNodeApp.getAbsolutePath(), "-v" /*, other args */);
		pbuilder.directory(getFilesDir());
		pbuilder.redirectErrorStream(true);
		try {
			mNodeProcess = pbuilder.start();
			mNodeState = NodeState.RUNNING;
		} catch (IOException e) {
			Log.e(TAG,"Error running node: "+e);
			mNodeProcess = null;
			mNodeState = NodeState.FAILED;
			return;
		}
		final Process process = mNodeProcess;
		// capture process output...
		new Thread() {
			public void run() {
				try {
					BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"));
					while(true) {
						String line = br.readLine();
						if (line==null)
							break;
						Log.d(TAG,"Node: "+line);
					}
					br.close();
					Log.d(TAG,"Process monitor ending");
					int rval = process.waitFor();
					Log.d(TAG,"Process monitor exit state "+rval);
				} catch (Exception e) {
					Log.w(TAG,"Error reading from node: "+e);
				};				
			}
		}.start();
	}
	private void stopNode() {
		if (mStartWhenReady) {
			Log.d(TAG,"Cancel start when ready");
			mStartWhenReady = false;
		}
		if (mNodeState!=NodeState.RUNNING)
			return;
		Log.d(TAG,"Stop node process");
		try {
			mNodeProcess.destroy();
		}
		catch (Exception e) {
			Log.d(TAG,"Error calling destroy on node: "+e);			
		}
		mNodeProcess = null;
		mNodeState = NodeState.READY;
	}
	/** file extractor task */
	private class ExtractFileTask extends AsyncTask<String,Integer,Long> {

		@Override
		protected Long doInBackground(String... files) {
			String file = files[0];
			Log.d(TAG,"Extracting "+file+"...");
			try {
				InputStream is = NodeService.this.getAssets().open(file);
				OutputStream os = new FileOutputStream(mNodeApp);
				byte buffer[] = new byte[100000];
				int len = 0;
				while(true) {
					int cnt = is.read(buffer);
					if (cnt<0)
						break;
					os.write(buffer, 0, cnt);
					len += cnt;
				}
				is.close();
				os.close();
				Log.d(TAG,"Extracted "+len+" bytes to "+mNodeApp);
				// requires API level 9!
				if (!mNodeApp.canExecute()) {
					if (!mNodeApp.setExecutable(true, false))
						Log.e(TAG,"Could not set Executable for "+mNodeApp);
					else
						Log.d(TAG,"Made executable: "+mNodeApp);
				}
				else
					Log.d(TAG,"Already executable: "+mNodeApp);
			} catch (IOException e) {
				Log.e(TAG,"Error extracting "+file+": "+e);
				return null;
			}
			return null;
		}
		/* on ui thread... */
		@Override
		protected void onPostExecute(Long result) {
			checkNodeApp();
		}		
	};
	
	/* (non-Javadoc)
	 * @see android.app.Service#onDestroy()
	 */
	@Override
	public void onDestroy() {
		// TODO Auto-generated method stub
		super.onDestroy();
	}

	/* (non-Javadoc)
	 * @see android.app.Service#onStartCommand(android.content.Intent, int, int)
	 */
	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		Log.d(TAG,"Node service: command "+intent.getAction());
		if (ACTION_START.equals(intent.getAction())) 
			startNode();
		else if (ACTION_STOP.equals(intent.getAction())) 
			stopNode();
		return START_STICKY;
	}

}
