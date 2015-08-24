.class public Lcom/chetbox/twitter/android/TweetListActivity;
.super Landroid/support/v7/app/AppCompatActivity;
.source "TweetListActivity.java"

# interfaces
.implements Landroid/support/v4/widget/SwipeRefreshLayout$OnRefreshListener;


# static fields
.field private static final COMPOSE_REQ_CODE:I = 0xa

.field private static final MAX_TWEETS_TO_SHOW:I = 0x14


# instance fields
.field private mSwipeRefresh:Landroid/support/v4/widget/SwipeRefreshLayout;

.field private mTimelineAdapter:Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;


# direct methods
.method public constructor <init>()V
    .registers 1

    .prologue
    .line 23
    invoke-direct {p0}, Landroid/support/v7/app/AppCompatActivity;-><init>()V

    return-void
.end method

.method static synthetic access$000(Lcom/chetbox/twitter/android/TweetListActivity;)Landroid/support/v4/widget/SwipeRefreshLayout;
    .registers 2
    .param p0, "x0"    # Lcom/chetbox/twitter/android/TweetListActivity;

    .prologue
    .line 23
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity;->mSwipeRefresh:Landroid/support/v4/widget/SwipeRefreshLayout;

    return-object v0
.end method


# virtual methods
.method protected onActivityResult(IILandroid/content/Intent;)V
    .registers 7
    .param p1, "requestCode"    # I
    .param p2, "resultCode"    # I
    .param p3, "data"    # Landroid/content/Intent;

    .prologue
    .line 98
    invoke-super {p0, p1, p2, p3}, Landroid/support/v7/app/AppCompatActivity;->onActivityResult(IILandroid/content/Intent;)V

    .line 100
    const/16 v1, 0xa

    if-ne p1, v1, :cond_28

    const/4 v1, -0x1

    if-ne p2, v1, :cond_28

    .line 101
    const-string v1, "update_text"

    invoke-virtual {p3, v1}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 104
    .local v0, "updateText":Ljava/lang/String;
    new-instance v1, Lcom/chetbox/twitter/android/UpdateStatusTask;

    invoke-direct {v1, v0}, Lcom/chetbox/twitter/android/UpdateStatusTask;-><init>(Ljava/lang/String;)V

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Void;

    invoke-virtual {v1, v2}, Lcom/chetbox/twitter/android/UpdateStatusTask;->execute([Ljava/lang/Object;)Landroid/os/AsyncTask;

    .line 109
    new-instance v1, Ljava/lang/Thread;

    new-instance v2, Lcom/chetbox/twitter/android/TweetListActivity$3;

    invoke-direct {v2, p0}, Lcom/chetbox/twitter/android/TweetListActivity$3;-><init>(Lcom/chetbox/twitter/android/TweetListActivity;)V

    invoke-direct {v1, v2}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    invoke-virtual {v1}, Ljava/lang/Thread;->start()V

    .line 125
    .end local v0    # "updateText":Ljava/lang/String;
    :cond_28
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 8
    .param p1, "savedInstanceState"    # Landroid/os/Bundle;

    .prologue
    .line 33
    invoke-super {p0, p1}, Landroid/support/v7/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V

    .line 34
    const v3, 0x7f04001a

    invoke-virtual {p0, v3}, Lcom/chetbox/twitter/android/TweetListActivity;->setContentView(I)V

    .line 36
    const v3, 0x7f0e0054

    invoke-virtual {p0, v3}, Lcom/chetbox/twitter/android/TweetListActivity;->findViewById(I)Landroid/view/View;

    move-result-object v3

    check-cast v3, Landroid/support/v4/widget/SwipeRefreshLayout;

    iput-object v3, p0, Lcom/chetbox/twitter/android/TweetListActivity;->mSwipeRefresh:Landroid/support/v4/widget/SwipeRefreshLayout;

    .line 37
    const v3, 0x102000a

    invoke-virtual {p0, v3}, Lcom/chetbox/twitter/android/TweetListActivity;->findViewById(I)Landroid/view/View;

    move-result-object v2

    check-cast v2, Landroid/widget/ListView;

    .line 38
    .local v2, "tweetList":Landroid/widget/ListView;
    const v3, 0x7f0e0055

    invoke-virtual {p0, v3}, Lcom/chetbox/twitter/android/TweetListActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/Button;

    .line 40
    .local v0, "composeButton":Landroid/widget/Button;
    invoke-static {}, Lcom/twitter/sdk/android/Twitter;->getSessionManager()Lcom/twitter/sdk/android/core/SessionManager;

    move-result-object v3

    invoke-interface {v3}, Lcom/twitter/sdk/android/core/SessionManager;->getActiveSession()Lcom/twitter/sdk/android/core/Session;

    move-result-object v1

    check-cast v1, Lcom/twitter/sdk/android/core/TwitterSession;

    .line 42
    .local v1, "session":Lcom/twitter/sdk/android/core/TwitterSession;
    invoke-virtual {v1}, Lcom/twitter/sdk/android/core/TwitterSession;->getUserName()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {p0, v3}, Lcom/chetbox/twitter/android/TweetListActivity;->setTitle(Ljava/lang/CharSequence;)V

    .line 44
    new-instance v3, Lcom/chetbox/twitter/android/LimitedTweetTimelineListAdapter;

    new-instance v4, Lcom/chetbox/twitter/android/HomeTimeline;

    invoke-direct {v4}, Lcom/chetbox/twitter/android/HomeTimeline;-><init>()V

    const/16 v5, 0x14

    invoke-direct {v3, p0, v4, v5}, Lcom/chetbox/twitter/android/LimitedTweetTimelineListAdapter;-><init>(Landroid/content/Context;Lcom/twitter/sdk/android/tweetui/Timeline;I)V

    iput-object v3, p0, Lcom/chetbox/twitter/android/TweetListActivity;->mTimelineAdapter:Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;

    .line 45
    iget-object v3, p0, Lcom/chetbox/twitter/android/TweetListActivity;->mTimelineAdapter:Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;

    invoke-virtual {v2, v3}, Landroid/widget/ListView;->setAdapter(Landroid/widget/ListAdapter;)V

    .line 47
    iget-object v3, p0, Lcom/chetbox/twitter/android/TweetListActivity;->mSwipeRefresh:Landroid/support/v4/widget/SwipeRefreshLayout;

    invoke-virtual {v3, p0}, Landroid/support/v4/widget/SwipeRefreshLayout;->setOnRefreshListener(Landroid/support/v4/widget/SwipeRefreshLayout$OnRefreshListener;)V

    .line 49
    new-instance v3, Lcom/chetbox/twitter/android/TweetListActivity$1;

    invoke-direct {v3, p0}, Lcom/chetbox/twitter/android/TweetListActivity$1;-><init>(Lcom/chetbox/twitter/android/TweetListActivity;)V

    invoke-virtual {v0, v3}, Landroid/widget/Button;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    .line 56
    return-void
.end method

.method public onCreateOptionsMenu(Landroid/view/Menu;)Z
    .registers 4
    .param p1, "menu"    # Landroid/view/Menu;

    .prologue
    .line 60
    invoke-virtual {p0}, Lcom/chetbox/twitter/android/TweetListActivity;->getMenuInflater()Landroid/view/MenuInflater;

    move-result-object v0

    const/high16 v1, 0x7f0f0000

    invoke-virtual {v0, v1, p1}, Landroid/view/MenuInflater;->inflate(ILandroid/view/Menu;)V

    .line 61
    const/4 v0, 0x1

    return v0
.end method

.method public onOptionsItemSelected(Landroid/view/MenuItem;)Z
    .registers 5
    .param p1, "item"    # Landroid/view/MenuItem;

    .prologue
    .line 66
    invoke-interface {p1}, Landroid/view/MenuItem;->getItemId()I

    move-result v1

    const v2, 0x7f0e008c

    if-ne v1, v2, :cond_1f

    .line 67
    invoke-static {}, Lcom/twitter/sdk/android/Twitter;->getSessionManager()Lcom/twitter/sdk/android/core/SessionManager;

    move-result-object v1

    invoke-interface {v1}, Lcom/twitter/sdk/android/core/SessionManager;->clearActiveSession()V

    .line 69
    new-instance v0, Landroid/content/Intent;

    const-class v1, Lcom/chetbox/twitter/android/LaunchActivity;

    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 70
    .local v0, "launchAppIntent":Landroid/content/Intent;
    invoke-virtual {p0, v0}, Lcom/chetbox/twitter/android/TweetListActivity;->startActivity(Landroid/content/Intent;)V

    .line 72
    invoke-virtual {p0}, Lcom/chetbox/twitter/android/TweetListActivity;->finish()V

    .line 74
    const/4 v1, 0x1

    .line 76
    .end local v0    # "launchAppIntent":Landroid/content/Intent;
    :goto_1e
    return v1

    :cond_1f
    invoke-super {p0, p1}, Landroid/support/v7/app/AppCompatActivity;->onOptionsItemSelected(Landroid/view/MenuItem;)Z

    move-result v1

    goto :goto_1e
.end method

.method public onRefresh()V
    .registers 3

    .prologue
    .line 81
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity;->mSwipeRefresh:Landroid/support/v4/widget/SwipeRefreshLayout;

    const/4 v1, 0x1

    invoke-virtual {v0, v1}, Landroid/support/v4/widget/SwipeRefreshLayout;->setRefreshing(Z)V

    .line 82
    iget-object v0, p0, Lcom/chetbox/twitter/android/TweetListActivity;->mTimelineAdapter:Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;

    new-instance v1, Lcom/chetbox/twitter/android/TweetListActivity$2;

    invoke-direct {v1, p0}, Lcom/chetbox/twitter/android/TweetListActivity$2;-><init>(Lcom/chetbox/twitter/android/TweetListActivity;)V

    invoke-virtual {v0, v1}, Lcom/twitter/sdk/android/tweetui/TweetTimelineListAdapter;->refresh(Lcom/twitter/sdk/android/core/Callback;)V

    .line 94
    return-void
.end method
